# sanity-turborepo-generators

## Getting Started

Install turborepo and `@turbo/gen` in your project:

```bash
# Global install
yarn global add turbo

# Install in repository
yarn add turbo @turbo/gen --dev
```

(find other package manager commands [here](https://turbo.build/repo/docs/getting-started/add-to-existing-repository#adding-turborepo-to-your-repository))

## Using the generator

Download the files from this repository to your project:

```bash
# Step 1: Clone the repository into a temporary directory
git clone --depth 1 --branch main https://github.com/aleciavogel/sanity-turborepo-generators.git temp

# Step 2: Move the contents up one level
mv temp/* ./
mv temp/.* ./

# Step 3: Remove the temporary directory and the .git directory
rm -rf temp
rm -rf .git
```

Then run the following command to run the generator:

```bash
turbo gen schema
```

Note: you'll still need to update your main sanity schema and your `sanity.config.ts` per usual (although, it's possible to automate this too!)

Feel free to edit the generator templates and the `config.ts` to suit your project's structure and needs.
