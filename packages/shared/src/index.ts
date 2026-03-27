export type TokenMap = { [key: string]: string };
export type NestedTokenMap = { [key: string]: string | NestedTokenMap };

export interface ComponentConfig {
  base: TokenMap;
  variants?: { [variantName: string]: TokenMap };
  states?: {
    hover?:       TokenMap;
    focus?:       TokenMap;
    active?:      TokenMap;
    disabled?:    TokenMap;
    checked?:     TokenMap;
    invalid?:     TokenMap;
    placeholder?: TokenMap;
    before?:      TokenMap;
    after?:       TokenMap;
  };
  responsive?: { [breakpoint: string]: TokenMap };
  compoundVariants?: Array<{ when: Record<string, string>; css: TokenMap }>;
}

export interface HoliConfig {
  tokens: {
    color?:      NestedTokenMap;
    spacing?:    NestedTokenMap;
    typography?: NestedTokenMap;
    radius?:     NestedTokenMap;
    shadow?:     NestedTokenMap;
    z?:          NestedTokenMap;
    opacity?:    NestedTokenMap;
    transition?: NestedTokenMap;
    blur?:       NestedTokenMap;
    [key: string]: NestedTokenMap | undefined;
  };
  breakpoints?: TokenMap;
  components?: { [name: string]: ComponentConfig };
  utilities?: {
    [name: string]: { base: TokenMap; responsive?: { [bp: string]: TokenMap } };
  };
  animations?: {
    [name: string]: {
      keyframes: { [stop: string]: TokenMap };
      duration?:  string;
      easing?:    string;
      fillMode?:  string;
    };
  };
  output?: {
    outputDir?:     string;
    prefix?:        string;
    utilities?:     boolean;
    mode?:          'inline' | 'variables';
    include?:       string[];
    themeStrategy?: 'media' | 'class';
  };
  themes?: {
    [themeName: string]: { [category: string]: TokenMap };
  };
}

// HoliConfigFile is what the loader reads (includes extends).
// The loader strips extends, merges base configs, then passes HoliConfig to the pipeline.
export interface HoliConfigFile extends HoliConfig {
  extends?: string | string[];
}

export type ResolvedConfig = HoliConfig;
export type EmitResult = Record<string, string>;
