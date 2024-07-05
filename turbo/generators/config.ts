import type { PlopTypes } from '@turbo/gen'
import fs from 'fs'
import path from 'path'

interface GeneratorData {
  feature: string
  name: string
  type: SchemaType
}

type SchemaType = 'document' | 'singleton' | 'object'

const isSingleton = (type: string) => type === 'singleton'
const isObject = (type: string) => type === 'object'
const isDocument = (type: string) => type === 'document'

const fileExists = (plop: PlopTypes.NodePlopAPI, filePath: string): boolean => {
  return fs.existsSync(path.resolve(plop.getDestBasePath(), filePath))
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.addHelper('eq', function (arg1: string, arg2: string) {
    return arg1 === arg2
  })

  // A generator to create FMP endpoint definitions and enums
  plop.setGenerator('schema', {
    description: 'Adds a new schema, context, and providers',
    prompts: [
      {
        type: 'input',
        name: 'feature',
        message: 'What is the feature name? (e.g. blog, product, etc.)',
      },
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the schema?',
      },
      {
        type: 'list',
        name: 'type',
        message: 'What type of schema is it?',
        choices: ['document', 'singleton', 'object'],
      },
    ],
    actions: [
      /**
       * Schema file
       */
      // Add schema file
      {
        type: 'add',
        path: 'features/{{kebabCase feature}}/_data/schemas/{{kebabCase name}}.ts',
        templateFile: 'templates/_data/schemas/{{type}}-schema.ts.hbs',
      },
      // Add schema import to index.ts
      {
        type: 'modify',
        path: 'features/{{kebabCase feature}}/_data/schemas/index.ts',
        // Add to top of import statements
        pattern: /^/,
        template: "import {{ camelCase name }} from './{{kebabCase name}}'\n",
        abortOnFail: false,
        skip(data: GeneratorData) {
          const filePath = `features/${plop.getHelper('kebabCase')(data.feature)}/_data/schemas/index.ts`
          if (!fileExists(plop, filePath)) {
            return `File ${filePath} does not exist. Skipping action.`
          }
        },
      },
      // Add schema to export
      {
        type: 'modify',
        path: 'features/{{kebabCase feature}}/_data/schemas/index.ts',
        pattern: /export \{/,
        template: 'export {\n  {{ camelCase name }},',
        abortOnFail: false,
        skip(data: GeneratorData) {
          const filePath = `features/${plop.getHelper('kebabCase')(data.feature)}/_data/schemas/index.ts`
          if (!fileExists(plop, filePath)) {
            return `File ${filePath} does not exist. Skipping action.`
          }
        },
      },
      // Create a new index.ts in _data/schemas if one does not already exist
      {
        type: 'add',
        path: 'features/{{kebabCase feature}}/_data/schemas/index.ts',
        templateFile: 'templates/_data/schemas/index.ts.hbs',
        skipIfExists: true,
      },

      /**
       * Loaders
       * For documents & singletons only
       */
      {
        // If file exists: Append schema import statement
        type: 'modify',
        path: 'features/{{kebabCase feature}}/_data/load.ts',
        pattern: /} from '@\/sanity\.types'/,
        template: "  {{ pascalCase name }}QueryResult,\n} from '@/sanity.types'",
        abortOnFail: false,
        skip(data: GeneratorData) {
          const filePath = `features/${plop.getHelper('kebabCase')(data.feature)}/_data/load.ts`
          if (!fileExists(plop, filePath)) {
            return `File ${filePath} does not exist. Skipping action.`
          }
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        // If file exists: Append import statement for sanity type
        type: 'modify',
        path: 'features/{{kebabCase feature}}/_data/load.ts',
        pattern: /} from '\.\/queries'/,
        template: "  {{ camelCase name }}QueryResult,\n} from './queries'",
        abortOnFail: false,
        skip(data: GeneratorData) {
          const filePath = `features/${plop.getHelper('kebabCase')(data.feature)}/_data/load.ts`
          if (!fileExists(plop, filePath)) {
            return `File ${filePath} does not exist. Skipping action.`
          }
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        // If file exists: Append loader for schema
        type: 'modify',
        path: 'features/{{kebabCase feature}}/_data/load.ts',
        pattern: /\s*$/,
        templateFile: 'templates/_data/load-partial.ts.hbs',
        abortOnFail: false,
        skip(data: GeneratorData) {
          const filePath = `features/${plop.getHelper('kebabCase')(data.feature)}/_data/load.ts`
          if (!fileExists(plop, filePath)) {
            return `File ${filePath} does not exist. Skipping action.`
          }
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        // If file does not exist: Create a new load.ts file
        type: 'add',
        path: 'features/{{kebabCase feature}}/_data/load.ts',
        templateFile: 'templates/_data/load.ts.hbs',
        skipIfExists: true,
        skip: (data: GeneratorData) => {
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },

      /**
       * Queries
       * For documents & singletons only
       */
      {
        // If file exists: Append queries for schema
        type: 'modify',
        path: 'features/{{kebabCase feature}}/_data/queries.ts',
        pattern: /\s*$/,
        templateFile: 'templates/_data/queries-partial.ts.hbs',
        abortOnFail: false,
        skip(data: GeneratorData) {
          const filePath = `features/${plop.getHelper('kebabCase')(data.feature)}/_data/queries.ts`
          if (!fileExists(plop, filePath)) {
            return `File ${filePath} does not exist. Skipping action.`
          }
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        // If file does not exist: Create a new queries.ts file
        type: 'add',
        path: 'features/{{kebabCase feature}}/_data/queries.ts',
        templateFile: 'templates/_data/queries.ts.hbs',
        skipIfExists: true,
        skip: (data: GeneratorData) => {
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },

      /**
       * Query Hooks
       * For documents & singletons only
       */
      {
        // If file exists: Append schema import statement
        type: 'modify',
        path: 'features/{{kebabCase feature}}/_data/hooks.ts',
        pattern: /} from '@\/sanity\.types'/,
        template: "  {{ pascalCase name }}QueryResult,\n} from '@/sanity.types'",
        abortOnFail: false,
        skip(data: GeneratorData) {
          const filePath = `features/${plop.getHelper('kebabCase')(data.feature)}/_data/hooks.ts`
          if (!fileExists(plop, filePath)) {
            return `File ${filePath} does not exist. Skipping action.`
          }
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        // If file exists: Append import statement for sanity type
        type: 'modify',
        path: 'features/{{kebabCase feature}}/_data/hooks.ts',
        pattern: /} from '\.\/queries'/,
        template: " {{ camelCase name }}Query,\n} from './queries'",
        abortOnFail: false,
        skip(data: GeneratorData) {
          const filePath = `features/${plop.getHelper('kebabCase')(data.feature)}/_data/hooks.ts`
          if (!fileExists(plop, filePath)) {
            return `File ${filePath} does not exist. Skipping action.`
          }
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        // If file exists: Append loader for schema
        type: 'modify',
        path: 'features/{{kebabCase feature}}/_data/hooks.ts',
        pattern: /\s*$/,
        templateFile: 'templates/_data/hooks-partial.ts.hbs',
        abortOnFail: false,
        skip(data: GeneratorData) {
          const filePath = `features/${plop.getHelper('kebabCase')(data.feature)}/_data/hooks.ts`
          if (!fileExists(plop, filePath)) {
            return `File ${filePath} does not exist. Skipping action.`
          }
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        // If file does not exist: Create a new hooks.ts file
        type: 'add',
        path: 'features/{{kebabCase feature}}/_data/hooks.ts',
        templateFile: 'templates/_data/hooks.ts.hbs',
        skipIfExists: true,
        skip: (data: GeneratorData) => {
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },

      /**
       * Hooks
       * Note - does not generate for objects
       */
      {
        // Add use{{pascalCase name}} hook
        type: 'add',
        path: 'features/{{kebabCase feature}}/hooks/use-{{kebabCase name}}.ts',
        templateFile: 'templates/hooks/use-hook.ts.hbs',
        skipIfExists: true,
        skip: (data: GeneratorData) => {
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        // Add use{{pascalCase name}} hook import statement
        type: 'modify',
        path: 'features/{{kebabCase feature}}/hooks/index.ts',
        pattern: /^/,
        template: "import use{{ pascalCase name }} from './use-{{kebabCase name}}'\n",
        abortOnFail: false,
        skip(data: GeneratorData) {
          const filePath = `features/${plop.getHelper('kebabCase')(data.feature)}/hooks/index.ts`
          if (!fileExists(plop, filePath)) {
            return `File ${filePath} does not exist. Skipping action.`
          }
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        // Add use{{pascalCase name}}Query hook export statement
        type: 'modify',
        path: 'features/{{kebabCase feature}}/hooks/index.ts',
        pattern: /export \{/,
        template: 'export {\n  use{{pascalCase name}},',
        abortOnFail: false,
        skip(data: GeneratorData) {
          const filePath = `features/${plop.getHelper('kebabCase')(data.feature)}/hooks/index.ts`
          if (!fileExists(plop, filePath)) {
            return `File ${filePath} does not exist. Skipping action.`
          }
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        // Create a new index.ts in hooks if one does not already exist
        type: 'add',
        path: 'features/{{kebabCase feature}}/hooks/index.ts',
        templateFile: 'templates/hooks/index.ts.hbs',
        skipIfExists: true,
        skip: (data: GeneratorData) => {
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },

      /**
       * Contexts
       * For documents & singletons only
       */
      {
        type: 'add',
        path: 'features/{{kebabCase feature}}/contexts/{{ kebabCase name }}-context/context.ts',
        templateFile: 'templates/contexts/context.ts.hbs',
        skip: (data: GeneratorData) => {
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        type: 'add',
        path: 'features/{{kebabCase feature}}/contexts/{{ kebabCase name }}-context/provider/index.tsx',
        templateFile: 'templates/contexts/providers/index.tsx.hbs',
        skip: (data: GeneratorData) => {
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        type: 'add',
        path: 'features/{{kebabCase feature}}/contexts/{{ kebabCase name }}-context/provider/preview-provider.tsx',
        templateFile: 'templates/contexts/providers/preview-provider.tsx.hbs',
        skip: (data: GeneratorData) => {
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        type: 'add',
        path: 'features/{{kebabCase feature}}/contexts/{{ kebabCase name }}-context/provider/provider.tsx',
        templateFile: 'templates/contexts/providers/provider.tsx.hbs',
        skip: (data: GeneratorData) => {
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        // Add context import statement
        type: 'modify',
        path: 'features/{{kebabCase feature}}/contexts/index.ts',
        pattern: /^/,
        template:
          "import {{ pascalCase name }}Provider from './{{ kebabCase name }}-context/provider'\n",
        abortOnFail: false,
        skip(data: GeneratorData) {
          const filePath = `features/${plop.getHelper('kebabCase')(data.feature)}/contexts/index.ts`
          if (!fileExists(plop, filePath)) {
            return `File ${filePath} does not exist. Skipping action.`
          }
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        // Add context export statement
        type: 'modify',
        path: 'features/{{kebabCase feature}}/contexts/index.ts',
        pattern: /export \{/,
        template: 'export {\n  {{pascalCase name}}Provider,',
        abortOnFail: false,
        skip(data: GeneratorData) {
          const filePath = `features/${plop.getHelper('kebabCase')(data.feature)}/contexts/index.ts`
          if (!fileExists(plop, filePath)) {
            return `File ${filePath} does not exist. Skipping action.`
          }
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
      {
        // Add context index if one does not exist
        type: 'add',
        path: 'features/{{kebabCase feature}}/contexts/index.ts',
        templateFile: 'templates/contexts/index.ts.hbs',
        skipIfExists: true,
        skip: (data: GeneratorData) => {
          if (isObject(data.type)) {
            return 'Skipping action for object type.'
          }
        },
      },
    ],
  })
}
