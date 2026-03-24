export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['tokens'],
  additionalProperties: false,
  properties: {
    tokens: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        additionalProperties: { type: 'string' },
      },
    },
    breakpoints: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
    components: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        required: ['base'],
        additionalProperties: false,
        properties: {
          base: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
          variants: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
          },
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
          keyframes: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
          },
          duration:  { type: 'string' },
          easing:    { type: 'string' },
          fillMode:  { type: 'string' },
        },
      },
    },
    output: {
      type: 'object',
      additionalProperties: false,
      properties: {
        outputDir:  { type: 'string' },
        prefix:     { type: 'string' },
        utilities:  { type: 'boolean' },
      },
    },
  },
} as const;
