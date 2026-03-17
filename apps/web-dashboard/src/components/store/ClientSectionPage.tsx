"use client";

import { ClientDiscovery } from "@/components/store/ClientDiscovery";
import { ClientStoresChrome } from "@/components/store/ClientStoresChrome";
import { ClientAppProvider } from "@/components/providers/ClientAppProvider";
import { renderSectionPanel, type ClientSectionId } from "@/components/store/client-sections";

export function ClientSectionPage({ section }: { section: ClientSectionId }) {
    return (
        <ClientAppProvider>
            <ClientStoresChrome activeSection={section}>
                {section === "restaurants" ? <ClientDiscovery /> : renderSectionPanel(section)}
            </ClientStoresChrome>
        </ClientAppProvider>
    );
}
