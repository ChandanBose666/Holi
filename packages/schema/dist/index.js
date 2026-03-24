"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  HoliValidationError: () => HoliValidationError,
  schema: () => schema,
  validate: () => validate
});
module.exports = __toCommonJS(index_exports);
var import_ajv = __toESM(require("ajv"));

// src/schema.ts
var schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["tokens"],
  additionalProperties: false,
  properties: {
    tokens: {
      type: "object",
      additionalProperties: {
        type: "object",
        additionalProperties: { type: "string" }
      }
    },
    breakpoints: {
      type: "object",
      additionalProperties: { type: "string" }
    },
    components: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["base"],
        additionalProperties: false,
        properties: {
          base: {
            type: "object",
            additionalProperties: { type: "string" }
          },
          variants: {
            type: "object",
            additionalProperties: {
              type: "object",
              additionalProperties: { type: "string" }
            }
          }
        }
      }
    },
    animations: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["keyframes"],
        additionalProperties: false,
        properties: {
          keyframes: {
            type: "object",
            additionalProperties: {
              type: "object",
              additionalProperties: { type: "string" }
            }
          },
          duration: { type: "string" },
          easing: { type: "string" },
          fillMode: { type: "string" }
        }
      }
    },
    output: {
      type: "object",
      additionalProperties: false,
      properties: {
        outputDir: { type: "string" },
        prefix: { type: "string" },
        utilities: { type: "boolean" }
      }
    }
  }
};

// src/errors.ts
var HoliValidationError = class extends Error {
  constructor(errors) {
    const messages = (errors ?? []).map((e) => `  ${e.instancePath || "(root)"} ${e.message}`).join("\n");
    super(`holi.config.json is invalid:
${messages}`);
    this.name = "HoliValidationError";
  }
};

// src/index.ts
var ajv = new import_ajv.default({ allErrors: true });
var _validate = ajv.compile(schema);
function validate(raw) {
  const valid = _validate(raw);
  if (!valid) throw new HoliValidationError(_validate.errors);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HoliValidationError,
  schema,
  validate
});
