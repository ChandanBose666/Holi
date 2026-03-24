import { HoliConfig } from '@holi/shared';
import Ajv from 'ajv';

declare const schema: {
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly type: "object";
    readonly required: readonly ["tokens"];
    readonly additionalProperties: false;
    readonly properties: {
        readonly tokens: {
            readonly type: "object";
            readonly additionalProperties: {
                readonly type: "object";
                readonly additionalProperties: {
                    readonly type: "string";
                };
            };
        };
        readonly breakpoints: {
            readonly type: "object";
            readonly additionalProperties: {
                readonly type: "string";
            };
        };
        readonly components: {
            readonly type: "object";
            readonly additionalProperties: {
                readonly type: "object";
                readonly required: readonly ["base"];
                readonly additionalProperties: false;
                readonly properties: {
                    readonly base: {
                        readonly type: "object";
                        readonly additionalProperties: {
                            readonly type: "string";
                        };
                    };
                    readonly variants: {
                        readonly type: "object";
                        readonly additionalProperties: {
                            readonly type: "object";
                            readonly additionalProperties: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
        };
        readonly animations: {
            readonly type: "object";
            readonly additionalProperties: {
                readonly type: "object";
                readonly required: readonly ["keyframes"];
                readonly additionalProperties: false;
                readonly properties: {
                    readonly keyframes: {
                        readonly type: "object";
                        readonly additionalProperties: {
                            readonly type: "object";
                            readonly additionalProperties: {
                                readonly type: "string";
                            };
                        };
                    };
                    readonly duration: {
                        readonly type: "string";
                    };
                    readonly easing: {
                        readonly type: "string";
                    };
                    readonly fillMode: {
                        readonly type: "string";
                    };
                };
            };
        };
        readonly output: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly outputDir: {
                    readonly type: "string";
                };
                readonly prefix: {
                    readonly type: "string";
                };
                readonly utilities: {
                    readonly type: "boolean";
                };
            };
        };
    };
};

declare class HoliValidationError extends Error {
    constructor(errors: Ajv['errors']);
}

declare function validate(raw: unknown): asserts raw is HoliConfig;

export { HoliValidationError, schema, validate };
