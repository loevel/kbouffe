import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";
import { hasPermission, canManageRole, ASSIGNABLE_ROLES, ROLE_HIERARCHY, type TeamRole, type Permission } from "./permissions";

// ── PIN crypto helpers (PBKDF2 via Web Crypto API — Cloudflare Workers compatible) ──

async function hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(pin),
        "PBKDF2",
        false,
        ["deriveBits"],
    );
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
        keyMaterial,
        256,
    );
    const hashArray = Array.from(new Uint8Array(bits));
    const saltArray = Array.from(salt);
    return `${saltArray.map((b) => b.toString(16).padStart(2, "0")).join("")}:${hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

async function verifyPin(pin: string, stored: string): Promise<boolean> {
    try {
        const [saltHex, hashHex] = stored.split(":");
        if (!saltHex || !hashHex) return false;
        const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(pin),
            "PBKDF2",
            false,
            ["deriveBits"],
        );
        const bits = await crypto.subtle.deriveBits(
            { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
            keyMaterial,
            256,
        );
        const hashArray = Array.from(new Uint8Array(bits));
        const computedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        return computedHash === hashHex;
    } catch {
        return false;
    }
}

// ── Simple in-process PIN attempt rate limiter (per restaurant) ──
// TODO: Replace with Cloudflare KV or Durable Objects for multi-instance deployments
const _pinAttempts = new Map<string, { count: number; resetAt: number }>();

function checkPinRateLimit(restaurantId: string): boolean {
    const now = Date.now();
    const rec = _pinAttempts.get(restaurantId);
    if (!rec || now > rec.resetAt) {
        _pinAttempts.set(restaurantId, { count: 1, resetAt: now + 60_000 });
        return true; // allowed
    }
    rec.count++;
    return rec.count <= 5;
}

function recordPinFailure(restaurantId: string): void {
    const now = Date.now();
    const rec = _pinAttempts.get(restaurantId);
    if (!rec || now > rec.resetAt) {
        _pinAttempts.set(restaurantId, { count: 1, resetAt: now + 60_000 });
    } else {
        rec.count++;
    }
}

function resetPinAttempts(restaurantId: string): void {
    _pinAttempts.delete(restaurantId);
}

export const teamRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

function getAdminClient(c: any) {
    return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

async function getCallerRole(c: any, permission?: Permission): Promise<{ role: TeamRole; userId: string; restaurantId: string } | Response> {
    const adminDb = getAdminClient(c);
    const userId = c.var.userId;
    const restaurantId = c.var.restaurantId;

    if (!userId || !restaurantId) return c.json({ error: "Non authentifié ou restaurant non spécifié" }, 401);

    // Check if the caller is the restaurant owner
    const { data: restaurant } = await adminDb
        .from("restaurants")
        .select("owner_id")
        .eq("id", restaurantId)
        .maybeSingle();

    if (restaurant?.owner_id === userId) {
        const role: TeamRole = "owner";
        if (permission && !hasPermission(role, permission)) {
            return c.json({ error: `Permission manquante: ${permission}` }, 403);
        }
        return { role, userId, restaurantId };
    }

    const { data: membership, error } = await adminDb
        .from("restaurant_members")
        .select("role")
        .eq("user_id", userId)
        .eq("restaurant_id", restaurantId)
        .eq("status", "active")
        .maybeSingle();

    if (error || !membership) return c.json({ error: "Accès refusé" }, 403);
    
    const role = membership.role as TeamRole;
    if (permission && !hasPermission(role, permission)) {
        return c.json({ error: `Permission manquante: ${permission}` }, 403);
    }

    return { role, userId, restaurantId };
}

/**
 * GET /team
 */
teamRoutes.get("/", async (c) => {
    try {
        const auth = await getCallerRole(c, "team:read");
        if (auth instanceof Response) return auth;
        const { restaurantId } = auth;
        const adminDb = getAdminClient(c);

        // Get the restaurant owner
        const { data: restaurant } = await adminDb
            .from("restaurants")
            .select("owner_id, created_at")
            .eq("id", restaurantId)
            .maybeSingle();

        // Get all members for this restaurant from Supabase
        const { data: membersRaw, error: membersError } = await adminDb
            .from("restaurant_members")
            .select(`
                id,
                user_id,
                role,
                status,
                created_at,
                accepted_at,
                invited_by,
                pin_hash
            `)
            .eq("restaurant_id", restaurantId);

        if (membersError) {
            return c.json({ error: membersError.message }, 500);
        }

        // Include the owner if not already in restaurant_members
        const ownerInMembers = restaurant?.owner_id && membersRaw.some(m => m.user_id === restaurant.owner_id);
        const allMembers = ownerInMembers || !restaurant?.owner_id
            ? membersRaw
            : [
                {
                    id: `owner-${restaurant.owner_id}`,
                    user_id: restaurant.owner_id,
                    role: "owner",
                    status: "active",
                    created_at: restaurant.created_at,
                    accepted_at: restaurant.created_at,
                    invited_by: null,
                    pin_hash: null,
                },
                ...membersRaw,
            ];

        // Enrich with user info from Supabase
        const userIds = allMembers.map(m => m.user_id);
        let membersWithUserInfo = allMembers.map(m => ({
            id: m.id,
            userId: m.user_id,
            role: m.role,
            status: m.status,
            createdAt: m.created_at,
            acceptedAt: m.accepted_at,
            invitedBy: m.invited_by,
            hasPin: m.pin_hash != null,
            email: "",
            fullName: null,
            avatarUrl: null,
            phone: null,
        }));

        if (userIds.length > 0) {
            const { data: supabaseUsers, error: usersError } = await adminDb
                .from("users")
                .select("id, email, full_name, avatar_url, phone")
                .in("id", userIds);
            
            if (!usersError && supabaseUsers) {
                const userMap = new Map(supabaseUsers.map(u => [u.id, u]));
                membersWithUserInfo = allMembers.map(m => {
                    const u = userMap.get(m.user_id);
                    return {
                        id: m.id,
                        userId: m.user_id,
                        role: m.role,
                        status: m.status,
                        createdAt: m.created_at,
                        acceptedAt: m.accepted_at,
                        invitedBy: m.invited_by,
                        hasPin: m.pin_hash != null,
                        email: u?.email || "",
                        fullName: u?.full_name || null,
                        avatarUrl: u?.avatar_url || null,
                        phone: u?.phone || null,
                    };
                });
            }
        }

        return c.json({ members: membersWithUserInfo, callerRole: auth.role });
    } catch (error) {
        console.error("GET /team error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

/**
 * POST /team/invite
 */
teamRoutes.post("/invite", async (c) => {
    try {
        const body = await c.req.json().catch(() => ({})) as { email?: string; role?: string };
        const { email, role } = body;

        if (!email || !role) {
            return c.json({ error: "Email et rôle requis" }, 400);
        }

        if (!ASSIGNABLE_ROLES.includes(role as TeamRole)) {
            return c.json({ error: "Rôle invalide" }, 400);
        }

        const auth = await getCallerRole(c, "team:invite");
        if (auth instanceof Response) return auth;
        const { role: callerRole, userId: callerUserId, restaurantId } = auth;
        const adminDb = getAdminClient(c);

        // Cannot invite someone to a higher or equal role than yours (unless owner)
        if (!canManageRole(callerRole, role as TeamRole)) {
            return c.json({ error: "Vous ne pouvez pas attribuer ce rôle" }, 403);
        }

        // Find the target user by email in Supabase
        const { data: targetUser, error: targetError } = await adminDb
            .from("users")
            .select("id, email")
            .eq("email", email.toLowerCase().trim())
            .maybeSingle();

        if (targetError || !targetUser) {
            return c.json(
                { error: "Aucun utilisateur trouvé avec cet email. L'utilisateur doit d'abord créer un compte Kbouffe." },
                404
            );
        }

        // Check if already a member
        const { data: existing, error: existingError } = await adminDb
            .from("restaurant_members")
            .select("*")
            .eq("restaurant_id", restaurantId)
            .eq("user_id", targetUser.id)
            .maybeSingle();

        if (existing) {
            if (existing.status === "active") {
                return c.json({ error: "Cet utilisateur est déjà membre de votre restaurant" }, 409);
            }
            if (existing.status === "pending") {
                return c.json({ error: "Une invitation est déjà en attente pour cet utilisateur" }, 409);
            }
            // If revoked, re-invite by updating
            await adminDb
                .from("restaurant_members")
                .update({ 
                    role, 
                    status: "pending", 
                    invited_by: callerUserId, 
                    created_at: new Date().toISOString(), 
                    accepted_at: null 
                })
                .eq("id", existing.id);

            return c.json({ success: true, reinvited: true });
        }

        // Create the membership (pending)
        const memberId = crypto.randomUUID();

        const { error: insertError } = await adminDb
            .from("restaurant_members")
            .insert({
                id: memberId,
                restaurant_id: restaurantId,
                user_id: targetUser.id,
                role,
                invited_by: callerUserId,
                status: "pending",
                created_at: new Date().toISOString(),
            });

        if (insertError) {
            return c.json({ error: insertError.message }, 500);
        }

        return c.json({ success: true, memberId });
    } catch (error) {
        console.error("POST /team/invite error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

/**
 * POST /team/create
 * Crée un compte utilisateur Supabase + l'ajoute directement comme membre actif.
 */
teamRoutes.post("/create", async (c) => {
    try {
        const body = await c.req.json().catch(() => ({})) as {
            fullName?: string;
            email?: string;
            phone?: string;
            password?: string;
            role?: string;
        };
        const { fullName, email, phone, password, role } = body;

        if (!fullName || !email || !password || !role) {
            return c.json({ error: "Nom, email, mot de passe et rôle requis" }, 400);
        }

        if (!ASSIGNABLE_ROLES.includes(role as TeamRole)) {
            return c.json({ error: "Rôle invalide" }, 400);
        }

        if (password.length < 8) {
            return c.json({ error: "Le mot de passe doit contenir au moins 8 caractères" }, 400);
        }

        const auth = await getCallerRole(c, "team:invite");
        if (auth instanceof Response) return auth;
        const { role: callerRole, userId: callerUserId, restaurantId } = auth;

        if (!canManageRole(callerRole, role as TeamRole)) {
            return c.json({ error: "Vous ne pouvez pas attribuer ce rôle" }, 403);
        }

        if (!c.env.SUPABASE_SERVICE_ROLE_KEY) {
            return c.json({ error: "Configuration serveur manquante" }, 500);
        }

        const supabaseAdmin = getAdminClient(c);

        const normalizedEmail = email.toLowerCase().trim();
        let targetUserId: string;

        // Check if user already exists in the public users table
        const { data: existingPublicUser } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", normalizedEmail)
            .maybeSingle();

        if (existingPublicUser) {
            // User exists — add them directly without creating a new account
            targetUserId = existingPublicUser.id;
        } else {
            // Try to create the Supabase auth user
            const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: normalizedEmail,
                password,
                email_confirm: true,
                user_metadata: { full_name: fullName, phone: phone ?? null },
            });

            if (createError) {
                // User may already exist in Auth but not in public.users — look them up
                if (createError.message?.toLowerCase().includes("already been registered") || createError.message?.toLowerCase().includes("already registered")) {
                    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
                    const authUser = authList?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
                    if (!authUser) {
                        return c.json({ error: "Cet email est déjà utilisé mais son compte est inaccessible" }, 409);
                    }
                    targetUserId = authUser.id;
                    // Sync into public.users in case it's missing
                    await supabaseAdmin.from("users").upsert({
                        id: targetUserId,
                        email: normalizedEmail,
                        full_name: authUser.user_metadata?.full_name ?? fullName,
                        phone: authUser.user_metadata?.phone ?? phone ?? null,
                        role: "user",
                    }, { onConflict: "id" });
                } else {
                    return c.json({ error: createError.message ?? "Erreur lors de la création du compte" }, 500);
                }
            } else if (!authData.user) {
                return c.json({ error: "Erreur lors de la création du compte" }, 500);
            } else {
                targetUserId = authData.user.id;
                // Create the users table record
                await supabaseAdmin.from("users").upsert({
                    id: targetUserId,
                    email: normalizedEmail,
                    full_name: fullName,
                    phone: phone ?? null,
                    role: "user",
                }, { onConflict: "id" });
            }
        }

        // Check if already a member
        const { data: existingMembership } = await supabaseAdmin
            .from("restaurant_members")
            .select("id, status")
            .eq("restaurant_id", restaurantId)
            .eq("user_id", targetUserId)
            .maybeSingle();

        if (existingMembership?.status === "active") {
            return c.json({ error: "Cet utilisateur est déjà membre actif de votre restaurant" }, 409);
        }

        const memberId = crypto.randomUUID();

        // Upsert the membership as directly active (reuse existingMembership query result)
        if (existingMembership) {
            await supabaseAdmin
                .from("restaurant_members")
                .update({
                    role,
                    status: "active",
                    invited_by: callerUserId,
                    accepted_at: new Date().toISOString(),
                })
                .eq("id", existingMembership.id);
        } else {
            const { error: insertError } = await supabaseAdmin
                .from("restaurant_members")
                .insert({
                    id: memberId,
                    restaurant_id: restaurantId,
                    user_id: targetUserId,
                    role,
                    invited_by: callerUserId,
                    status: "active",
                    created_at: new Date().toISOString(),
                    accepted_at: new Date().toISOString(),
                });

            if (insertError) {
                return c.json({ error: insertError.message }, 500);
            }
        }

        // Si le rôle est driver, mettre à jour user_metadata pour la redirection
        if (role === "driver") {
            await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                user_metadata: { role: "livreur" },
            });
            await supabaseAdmin.from("drivers").upsert({
                user_id: targetUserId,
                restaurant_id: restaurantId,
            }, { onConflict: "user_id" });
        }

        return c.json({ success: true, memberId: existingMembership?.id ?? memberId });
    } catch (error) {
        console.error("POST /team/create error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

/**
 * POST /team/accept
 */
teamRoutes.post("/accept", async (c) => {
    try {
        const userId = c.var.userId;
        if (!userId) return c.json({ error: "Non authentifié" }, 401);

        const body = await c.req.json().catch(() => ({})) as { memberId?: string };
        const { memberId } = body;

        if (!memberId) {
            return c.json({ error: "memberId requis" }, 400);
        }

        const adminDb = getAdminClient(c);

        // Find the pending membership for this user
        const { data: membership, error: membershipError } = await adminDb
            .from("restaurant_members")
            .select("*")
            .eq("id", memberId)
            .eq("user_id", userId)
            .eq("status", "pending")
            .maybeSingle();

        if (membershipError || !membership) {
            return c.json({ error: "Invitation introuvable ou déjà traitée" }, 404);
        }

        // Accept the invitation
        await adminDb
            .from("restaurant_members")
            .update({ status: "active", accepted_at: new Date().toISOString() })
            .eq("id", memberId);

        // If role is driver, update the drivers table to link to this restaurant
        if (membership.role === "driver") {
            await adminDb
                .from("drivers")
                .update({ restaurant_id: membership.restaurant_id })
                .eq("user_id", userId);
        }

        return c.json({ success: true });
    } catch (error) {
        console.error("POST /team/accept error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

/**
 * POST /team/verify-pin
 * Vérifie un PIN et retourne les informations du membre correspondant.
 * Utilisé par les tablettes PDV — requiert uniquement un JWT restaurant valide.
 *
 * IMPORTANT: Cette route doit être enregistrée AVANT /:memberId/pin pour éviter
 * les conflits de paramètre de route.
 */
teamRoutes.post("/verify-pin", async (c) => {
    try {
        const userId = c.var.userId;
        const restaurantId = c.var.restaurantId;
        if (!userId || !restaurantId) {
            return c.json({ error: "Non authentifié ou restaurant non spécifié" }, 401);
        }

        const body = await c.req.json().catch(() => ({})) as {
            pin?: string;
            requiredRole?: string;
        };
        const { pin, requiredRole } = body;

        if (!pin || !/^\d{4}$/.test(pin)) {
            return c.json({ error: "Le PIN doit être composé de 4 chiffres" }, 400);
        }

        // Rate limiting — max 5 failed attempts per restaurant per minute
        if (!checkPinRateLimit(restaurantId)) {
            return c.json(
                { error: "Trop de tentatives. Réessayez dans 1 minute." },
                429,
            );
        }

        const adminDb = getAdminClient(c);

        // Fetch all active members with a PIN set
        const { data: membersWithPin, error: membersError } = await adminDb
            .from("restaurant_members")
            .select("id, user_id, role, pin_hash")
            .eq("restaurant_id", restaurantId)
            .eq("status", "active")
            .not("pin_hash", "is", null);

        if (membersError) {
            return c.json({ error: "Erreur interne" }, 500);
        }

        // Try each member's PIN — do NOT short-circuit to avoid timing attacks
        let matchedMember: { id: string; userId: string; role: string } | null = null;

        for (const member of membersWithPin ?? []) {
            // eslint-disable-next-line no-await-in-loop
            const ok = await verifyPin(pin, member.pin_hash as string);
            if (ok && matchedMember === null) {
                matchedMember = {
                    id: member.id,
                    userId: member.user_id,
                    role: member.role,
                };
            }
        }

        if (!matchedMember) {
            recordPinFailure(restaurantId);
            return c.json({ success: false, error: "PIN incorrect" }, 401);
        }

        // Check role hierarchy if requiredRole provided
        if (requiredRole) {
            const memberLevel = ROLE_HIERARCHY[matchedMember.role as TeamRole] ?? 0;
            const requiredLevel = ROLE_HIERARCHY[requiredRole as TeamRole] ?? 0;
            if (memberLevel < requiredLevel) {
                recordPinFailure(restaurantId);
                return c.json(
                    { success: false, error: "Permissions insuffisantes pour cette action" },
                    403,
                );
            }
        }

        // Fetch the member's name from users table
        const { data: userRecord } = await adminDb
            .from("users")
            .select("full_name, email")
            .eq("id", matchedMember.userId)
            .maybeSingle();

        const name =
            userRecord?.full_name ||
            userRecord?.email ||
            "Membre";

        // Successful verification — reset rate limit counter
        resetPinAttempts(restaurantId);

        return c.json({
            success: true,
            member: {
                id: matchedMember.id,
                name,
                role: matchedMember.role,
            },
        });
    } catch (error) {
        console.error("POST /team/verify-pin error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

/**
 * POST /team/:memberId/pin
 * Définit ou met à jour le PIN PDV d'un membre.
 * Autorisé : owner/manager (team:manage_roles) OU le membre lui-même.
 */
teamRoutes.post("/:memberId/pin", async (c) => {
    try {
        const memberId = c.req.param("memberId");
        const userId = c.var.userId;
        const restaurantId = c.var.restaurantId;

        if (!userId || !restaurantId) {
            return c.json({ error: "Non authentifié ou restaurant non spécifié" }, 401);
        }

        const body = await c.req.json().catch(() => ({})) as { pin?: string };
        const { pin } = body;

        if (!pin || !/^\d{4}$/.test(pin)) {
            return c.json({ error: "Le PIN doit être composé de 4 chiffres" }, 400);
        }

        const adminDb = getAdminClient(c);

        // Handle virtual owner ID (format: "owner-{userId}")
        // The owner may not have a restaurant_members row yet — create one on the fly.
        let resolvedMemberId = memberId;
        if (memberId.startsWith("owner-")) {
            const ownerUserId = memberId.replace("owner-", "");

            // Check if a real row exists for this owner
            const { data: existing } = await adminDb
                .from("restaurant_members")
                .select("id")
                .eq("user_id", ownerUserId)
                .eq("restaurant_id", restaurantId)
                .maybeSingle();

            if (existing) {
                resolvedMemberId = existing.id;
            } else {
                // Create the missing restaurant_members row for the owner
                const { data: inserted, error: insertError } = await adminDb
                    .from("restaurant_members")
                    .insert({
                        user_id: ownerUserId,
                        restaurant_id: restaurantId,
                        role: "owner",
                        status: "active",
                        invited_by: null,
                    })
                    .select("id")
                    .single();

                if (insertError || !inserted) {
                    console.error("Owner member row insert error:", insertError);
                    return c.json({ error: "Impossible de créer l'entrée membre pour le propriétaire" }, 500);
                }
                resolvedMemberId = inserted.id;
            }
        }

        // Fetch target member using the resolved (real) ID
        const { data: target, error: targetError } = await adminDb
            .from("restaurant_members")
            .select("id, user_id, role, status")
            .eq("id", resolvedMemberId)
            .eq("restaurant_id", restaurantId)
            .maybeSingle();

        if (targetError || !target) {
            return c.json({ error: "Membre introuvable" }, 404);
        }

        // Authorization: member setting their own PIN, or manager/owner setting any PIN
        const isSelf = target.user_id === userId;

        if (!isSelf) {
            // Caller must have team:manage_roles permission
            const auth = await getCallerRole(c, "team:manage_roles");
            if (auth instanceof Response) return auth;
        }

        // Hash and store the PIN
        const pinHash = await hashPin(pin);

        const { error: updateError } = await adminDb
            .from("restaurant_members")
            .update({
                pin_hash: pinHash,
                pin_set_at: new Date().toISOString(),
            })
            .eq("id", resolvedMemberId);

        if (updateError) {
            console.error("PIN update error:", updateError);
            return c.json({ error: "Erreur lors de la mise à jour du PIN" }, 500);
        }

        return c.json({ success: true, message: "PIN défini avec succès" });
    } catch (error) {
        console.error("POST /team/:memberId/pin error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

/**
 * PATCH /team/:memberId
 */
teamRoutes.patch("/:memberId", async (c) => {
    try {
        const memberId = c.req.param("memberId");
        const body = await c.req.json().catch(() => ({})) as { role?: string };
        const { role } = body;

        if (!role || !ASSIGNABLE_ROLES.includes(role as TeamRole)) {
            return c.json({ error: "Rôle invalide" }, 400);
        }

        const auth = await getCallerRole(c, "team:manage_roles");
        if (auth instanceof Response) return auth;
        const { role: callerRole, restaurantId } = auth;
        const adminDb = getAdminClient(c);

        // Target membership
        const { data: target, error: targetError } = await adminDb
            .from("restaurant_members")
            .select("*")
            .eq("id", memberId)
            .eq("restaurant_id", restaurantId)
            .maybeSingle();

        if (targetError || !target) {
            return c.json({ error: "Membre introuvable" }, 404);
        }

        if (target.role === "owner") {
            return c.json({ error: "Impossible de modifier le rôle du propriétaire" }, 403);
        }

        if (!canManageRole(callerRole, role as TeamRole)) {
            return c.json({ error: "Vous ne pouvez pas attribuer ce rôle" }, 403);
        }

        const oldRole = target.role;
        await adminDb
            .from("restaurant_members")
            .update({ role })
            .eq("id", memberId);

        // Sync driver table et user_metadata
        if (role === "driver") {
            await adminDb.from("drivers").upsert(
                { user_id: target.user_id, restaurant_id: restaurantId },
                { onConflict: "user_id" }
            );
            await adminDb.auth.admin.updateUserById(target.user_id, {
                user_metadata: { role: "livreur" },
            });
        } else if (oldRole === "driver") {
            await adminDb.from("drivers").update({ restaurant_id: null }).eq("user_id", target.user_id);
            await adminDb.auth.admin.updateUserById(target.user_id, {
                user_metadata: { role: "user" },
            });
        }

        return c.json({ success: true });
    } catch (error) {
        console.error("PATCH /team/:memberId error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

/**
 * DELETE /team/:memberId
 */
teamRoutes.delete("/:memberId", async (c) => {
    try {
        const memberId = c.req.param("memberId");
        
        const auth = await getCallerRole(c, "team:invite");
        if (auth instanceof Response) return auth;
        const { role: callerRole, restaurantId } = auth;
        const adminDb = getAdminClient(c);

        // Target membership
        const { data: target, error: targetError } = await adminDb
            .from("restaurant_members")
            .select("*")
            .eq("id", memberId)
            .eq("restaurant_id", restaurantId)
            .maybeSingle();

        if (targetError || !target) {
            return c.json({ error: "Membre introuvable" }, 404);
        }

        if (target.role === "owner") {
            return c.json({ error: "Impossible de révoquer le propriétaire" }, 403);
        }

        if (!canManageRole(callerRole, target.role as TeamRole)) {
            return c.json({ error: "Vous ne pouvez pas révoquer ce membre" }, 403);
        }

        await adminDb
            .from("restaurant_members")
            .update({ status: "revoked" })
            .eq("id", memberId);

        // Si c'était un driver, dissocier du restaurant et réinitialiser le rôle
        if (target.role === "driver") {
            await adminDb.from("drivers").update({ restaurant_id: null, is_online: false }).eq("user_id", target.user_id);
            await adminDb.auth.admin.updateUserById(target.user_id, {
                user_metadata: { role: "user" },
            });
        }

        return c.json({ success: true });
    } catch (error) {
        console.error("DELETE /team/:memberId error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});
