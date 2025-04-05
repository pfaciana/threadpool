---
sidebar_position: 2
title: Installation
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Installation

## Installation Methods

ThreadPool can be installed from either NPM or JSR registries using your preferred package manager.

<Tabs>
  <TabItem value="npm" label="NPM">

    <Tabs groupId="package-manager">
      <TabItem value="npm" label="NPM">

```bash
npm install @renderdev/threadpool
```

      </TabItem>
      <TabItem value="pnpm" label="PNPM" default>

```bash
pnpm add @renderdev/threadpool
```

      </TabItem>
      <TabItem value="yarn" label="Yarn">

```bash
yarn add @renderdev/threadpool
```

      </TabItem>
      <TabItem value="bun" label="Bun">

```bash
bun add @renderdev/threadpool
```

      </TabItem>
      <TabItem value="deno" label="Deno">

```ts
import * as threadpool from 'npm:@renderdev/threadpool'
```

      </TabItem>
    </Tabs>

  </TabItem>
  <TabItem value="jsr" label="JSR" default>

    <Tabs groupId="package-manager">
      <TabItem value="npm" label="NPM">

```bash
npx jsr add @renderdev/threadpool
```

      </TabItem>
      <TabItem value="pnpm" label="PNPM" default>

```bash
pnpm dlx jsr add @renderdev/threadpool
```

      </TabItem>
      <TabItem value="yarn" label="Yarn">

```bash
yarn dlx jsr add @renderdev/threadpool
```

      </TabItem>
      <TabItem value="bun" label="Bun">

```bash
bunx jsr add @renderdev/threadpool
```

      </TabItem>
      <TabItem value="deno" label="Deno">

```ts
import * as threadpool from 'jsr:@renderdev/threadpool'
```

      </TabItem>
    </Tabs>

  </TabItem>
</Tabs>
