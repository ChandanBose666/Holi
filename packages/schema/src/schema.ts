const nestedStringValues = {
  anyOf: [
    { type: 'object', additionalProperties: { type: 'string' } },
    {
      type: 'object',
      additionalProperties: {
        anyOf: [
          { type: 'string' },
          { type: 'object', additionalProperties: { type: 'string' } },
        ],
      },
    },
  ],
} as const;

const tokenMapSchema = {
  type: 'object',
  additionalProperties: { type: 'string' },
} as const;

const componentSchema = {
  type: 'object',
  required: ['base'],
  additionalProperties: false,
  properties: {
    base:     tokenMapSchema,
    variants: { type: 'object', additionalProperties: tokenMapSchema },
    states: {
      type: 'object',
      additionalProperties: false,
      properties: {
        hover:       tokenMapSchema,
        focus:       tokenMapSchema,
        active:      tokenMapSchema,
        disabled:    tokenMapSchema,
        checked:     tokenMapSchema,
        invalid:     tokenMapSchema,
        placeholder: tokenMapSchema,
        before:      tokenMapSchema,
        after:       tokenMapSchema,
      },
    },
    responsive: { type: 'object', additionalProperties: tokenMapSchema },
    compoundVariants: {
      type: 'array',
      items: {
        type: 'object',
        required: ['when', 'css'],
        additionalProperties: false,
        properties: {
          when: { type: 'object', additionalProperties: { type: 'string' } },
          css:  tokenMapSchema,
        },
      },
    },
  },
} as const;

export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['tokens'],
  additionalProperties: false,
  properties: {
    tokens: {
      type: 'object',
      additionalProperties: nestedStringValues,
    },
    breakpoints: tokenMapSchema,
    components: {
      type: 'object',
      additionalProperties: componentSchema,
    },
    utilities: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        required: ['base'],
        additionalProperties: false,
        properties: {
          base:       tokenMapSchema,
          responsive: { type: 'object', additionalProperties: tokenMapSchema },
        },
      },
    },
    animations: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        required: ['keyframes'],
        additionalProperties: false,
        properties: {
          keyframes: { type: 'object', additionalProperties: tokenMapSchema },
          duration:  { type: 'string' },
          easing:    { type: 'string' },
          fillMode:  { type: 'string' },
        },
      },
    },
    themes: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        additionalProperties: tokenMapSchema,
      },
    },
    output: {
      type: 'object',
      additionalProperties: false,
      properties: {
        outputDir:     { type: 'string' },
        prefix:        { type: 'string' },
        utilities:     { type: 'boolean' },
        mode:          { type: 'string', enum: ['inline', 'variables'] },
        include:       { type: 'array', items: { type: 'string' } },
        themeStrategy: { type: 'string', enum: ['media', 'class'] },
      },
    },
  },
} as const;
