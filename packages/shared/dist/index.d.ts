export interface TokenMap {
    [key: string]: string;
}
export interface HoliConfig {
    tokens: {
        color?: TokenMap;
        spacing?: TokenMap;
        typography?: TokenMap;
        radius?: TokenMap;
        shadow?: TokenMap;
        [key: string]: TokenMap | undefined;
    };
    breakpoints?: TokenMap;
    components?: {
        [name: string]: {
            base: TokenMap;
            variants?: {
                [variantName: string]: TokenMap;
            };
        };
    };
    animations?: {
        [name: string]: {
            keyframes: {
                [stop: string]: TokenMap;
            };
            duration?: string;
            easing?: string;
            fillMode?: string;
        };
    };
    output?: {
        outputDir?: string;
        prefix?: string;
        utilities?: boolean;
    };
}
export type ResolvedConfig = HoliConfig;
export type EmitResult = Record<string, string>;
//# sourceMappingURL=index.d.ts.map