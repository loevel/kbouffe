import "@opennextjs/cloudflare";

declare module "@opennextjs/cloudflare" {
    interface CloudflareEnv {
        IMAGES_BUCKET: R2Bucket;
    }
}

declare global {
    interface CloudflareEnv {
        IMAGES_BUCKET: R2Bucket;
    }
    
    // Fallback if @cloudflare/workers-types is not available
    interface R2Bucket {
        put(key: string, value: ReadableStream | ArrayBuffer | string, options?: any): Promise<any>;
        get(key: string): Promise<any>;
        delete(key: string): Promise<void>;
        list(options?: any): Promise<any>;
    }
}

export {};
