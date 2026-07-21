import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  ignoreNoDocuments: true,
  schema: `http://localhost:4000/graphql`,
  documents: ["src/graphql/**/*.graphql"],
  generates: {
    "./src/generated/": {
      preset: "client",
      presetConfig: {
        fragmentMasking: false,
      },
      config: {
        avoidOptionals: {
          field: true,
          inputValue: false,
        },
        useTypeImports: true,
        nonOptionalTypename: true,
        skipTypeNameForRoot: true,
      },
    },
  },
};

export default config;
