# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ReadAllData*](#readalldata)
  - [*PublicData*](#publicdata)
- [**Mutations**](#mutations)
  - [*CreateAllData*](#createalldata)
  - [*UpdateAllData*](#updatealldata)
  - [*DeleteAllData*](#deletealldata)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ReadAllData
You can execute the `ReadAllData` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
readAllData(options?: ExecuteQueryOptions): QueryPromise<ReadAllDataData, undefined>;

interface ReadAllDataRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ReadAllDataData, undefined>;
}
export const readAllDataRef: ReadAllDataRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
readAllData(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ReadAllDataData, undefined>;

interface ReadAllDataRef {
  ...
  (dc: DataConnect): QueryRef<ReadAllDataData, undefined>;
}
export const readAllDataRef: ReadAllDataRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the readAllDataRef:
```typescript
const name = readAllDataRef.operationName;
console.log(name);
```

### Variables
The `ReadAllData` query has no variables.
### Return Type
Recall that executing the `ReadAllData` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ReadAllDataData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ReadAllDataData {
  machine?: {
    locationName: string;
  };
  product?: {
    name: string;
  };
  order?: {
    totalAmount: number;
  };
  orderItem?: {
    quantity: number;
  };
  inventory?: {
    currentStock: number;
  };
  machines: ({
    locationName: string;
  })[];
  products: ({
    name: string;
  })[];
  orders: ({
    id: UUIDString;
  } & Order_Key)[];
  orderItems: ({
    quantity: number;
  })[];
  inventories: ({
    currentStock: number;
  })[];
}
```
### Using `ReadAllData`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, readAllData } from '@dataconnect/generated';


// Call the `readAllData()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await readAllData();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await readAllData(dataConnect);

console.log(data.machine);
console.log(data.product);
console.log(data.order);
console.log(data.orderItem);
console.log(data.inventory);
console.log(data.machines);
console.log(data.products);
console.log(data.orders);
console.log(data.orderItems);
console.log(data.inventories);

// Or, you can use the `Promise` API.
readAllData().then((response) => {
  const data = response.data;
  console.log(data.machine);
  console.log(data.product);
  console.log(data.order);
  console.log(data.orderItem);
  console.log(data.inventory);
  console.log(data.machines);
  console.log(data.products);
  console.log(data.orders);
  console.log(data.orderItems);
  console.log(data.inventories);
});
```

### Using `ReadAllData`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, readAllDataRef } from '@dataconnect/generated';


// Call the `readAllDataRef()` function to get a reference to the query.
const ref = readAllDataRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = readAllDataRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.machine);
console.log(data.product);
console.log(data.order);
console.log(data.orderItem);
console.log(data.inventory);
console.log(data.machines);
console.log(data.products);
console.log(data.orders);
console.log(data.orderItems);
console.log(data.inventories);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.machine);
  console.log(data.product);
  console.log(data.order);
  console.log(data.orderItem);
  console.log(data.inventory);
  console.log(data.machines);
  console.log(data.products);
  console.log(data.orders);
  console.log(data.orderItems);
  console.log(data.inventories);
});
```

## PublicData
You can execute the `PublicData` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
publicData(options?: ExecuteQueryOptions): QueryPromise<PublicDataData, undefined>;

interface PublicDataRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<PublicDataData, undefined>;
}
export const publicDataRef: PublicDataRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
publicData(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<PublicDataData, undefined>;

interface PublicDataRef {
  ...
  (dc: DataConnect): QueryRef<PublicDataData, undefined>;
}
export const publicDataRef: PublicDataRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the publicDataRef:
```typescript
const name = publicDataRef.operationName;
console.log(name);
```

### Variables
The `PublicData` query has no variables.
### Return Type
Recall that executing the `PublicData` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PublicDataData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface PublicDataData {
  products: ({
    name: string;
    basePrice: number;
    imageUrl?: string | null;
  })[];
}
```
### Using `PublicData`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, publicData } from '@dataconnect/generated';


// Call the `publicData()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await publicData();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await publicData(dataConnect);

console.log(data.products);

// Or, you can use the `Promise` API.
publicData().then((response) => {
  const data = response.data;
  console.log(data.products);
});
```

### Using `PublicData`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, publicDataRef } from '@dataconnect/generated';


// Call the `publicDataRef()` function to get a reference to the query.
const ref = publicDataRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = publicDataRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.products);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.products);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateAllData
You can execute the `CreateAllData` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createAllData(): MutationPromise<CreateAllDataData, undefined>;

interface CreateAllDataRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateAllDataData, undefined>;
}
export const createAllDataRef: CreateAllDataRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createAllData(dc: DataConnect): MutationPromise<CreateAllDataData, undefined>;

interface CreateAllDataRef {
  ...
  (dc: DataConnect): MutationRef<CreateAllDataData, undefined>;
}
export const createAllDataRef: CreateAllDataRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createAllDataRef:
```typescript
const name = createAllDataRef.operationName;
console.log(name);
```

### Variables
The `CreateAllData` mutation has no variables.
### Return Type
Recall that executing the `CreateAllData` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateAllDataData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateAllDataData {
  machine_insert: Machine_Key;
  product_insert: Product_Key;
  order_insert: Order_Key;
  orderItem_insert: OrderItem_Key;
  inventory_insert: Inventory_Key;
}
```
### Using `CreateAllData`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createAllData } from '@dataconnect/generated';


// Call the `createAllData()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createAllData();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createAllData(dataConnect);

console.log(data.machine_insert);
console.log(data.product_insert);
console.log(data.order_insert);
console.log(data.orderItem_insert);
console.log(data.inventory_insert);

// Or, you can use the `Promise` API.
createAllData().then((response) => {
  const data = response.data;
  console.log(data.machine_insert);
  console.log(data.product_insert);
  console.log(data.order_insert);
  console.log(data.orderItem_insert);
  console.log(data.inventory_insert);
});
```

### Using `CreateAllData`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createAllDataRef } from '@dataconnect/generated';


// Call the `createAllDataRef()` function to get a reference to the mutation.
const ref = createAllDataRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createAllDataRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.machine_insert);
console.log(data.product_insert);
console.log(data.order_insert);
console.log(data.orderItem_insert);
console.log(data.inventory_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.machine_insert);
  console.log(data.product_insert);
  console.log(data.order_insert);
  console.log(data.orderItem_insert);
  console.log(data.inventory_insert);
});
```

## UpdateAllData
You can execute the `UpdateAllData` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateAllData(): MutationPromise<UpdateAllDataData, undefined>;

interface UpdateAllDataRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateAllDataData, undefined>;
}
export const updateAllDataRef: UpdateAllDataRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateAllData(dc: DataConnect): MutationPromise<UpdateAllDataData, undefined>;

interface UpdateAllDataRef {
  ...
  (dc: DataConnect): MutationRef<UpdateAllDataData, undefined>;
}
export const updateAllDataRef: UpdateAllDataRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateAllDataRef:
```typescript
const name = updateAllDataRef.operationName;
console.log(name);
```

### Variables
The `UpdateAllData` mutation has no variables.
### Return Type
Recall that executing the `UpdateAllData` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateAllDataData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateAllDataData {
  machine_update?: Machine_Key | null;
  product_update?: Product_Key | null;
  order_update?: Order_Key | null;
  orderItem_update?: OrderItem_Key | null;
  inventory_update?: Inventory_Key | null;
}
```
### Using `UpdateAllData`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateAllData } from '@dataconnect/generated';


// Call the `updateAllData()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateAllData();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateAllData(dataConnect);

console.log(data.machine_update);
console.log(data.product_update);
console.log(data.order_update);
console.log(data.orderItem_update);
console.log(data.inventory_update);

// Or, you can use the `Promise` API.
updateAllData().then((response) => {
  const data = response.data;
  console.log(data.machine_update);
  console.log(data.product_update);
  console.log(data.order_update);
  console.log(data.orderItem_update);
  console.log(data.inventory_update);
});
```

### Using `UpdateAllData`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateAllDataRef } from '@dataconnect/generated';


// Call the `updateAllDataRef()` function to get a reference to the mutation.
const ref = updateAllDataRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateAllDataRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.machine_update);
console.log(data.product_update);
console.log(data.order_update);
console.log(data.orderItem_update);
console.log(data.inventory_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.machine_update);
  console.log(data.product_update);
  console.log(data.order_update);
  console.log(data.orderItem_update);
  console.log(data.inventory_update);
});
```

## DeleteAllData
You can execute the `DeleteAllData` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteAllData(): MutationPromise<DeleteAllDataData, undefined>;

interface DeleteAllDataRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteAllDataData, undefined>;
}
export const deleteAllDataRef: DeleteAllDataRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteAllData(dc: DataConnect): MutationPromise<DeleteAllDataData, undefined>;

interface DeleteAllDataRef {
  ...
  (dc: DataConnect): MutationRef<DeleteAllDataData, undefined>;
}
export const deleteAllDataRef: DeleteAllDataRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteAllDataRef:
```typescript
const name = deleteAllDataRef.operationName;
console.log(name);
```

### Variables
The `DeleteAllData` mutation has no variables.
### Return Type
Recall that executing the `DeleteAllData` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteAllDataData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteAllDataData {
  machine_delete?: Machine_Key | null;
  product_delete?: Product_Key | null;
  order_delete?: Order_Key | null;
  orderItem_delete?: OrderItem_Key | null;
  inventory_delete?: Inventory_Key | null;
}
```
### Using `DeleteAllData`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteAllData } from '@dataconnect/generated';


// Call the `deleteAllData()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteAllData();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteAllData(dataConnect);

console.log(data.machine_delete);
console.log(data.product_delete);
console.log(data.order_delete);
console.log(data.orderItem_delete);
console.log(data.inventory_delete);

// Or, you can use the `Promise` API.
deleteAllData().then((response) => {
  const data = response.data;
  console.log(data.machine_delete);
  console.log(data.product_delete);
  console.log(data.order_delete);
  console.log(data.orderItem_delete);
  console.log(data.inventory_delete);
});
```

### Using `DeleteAllData`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteAllDataRef } from '@dataconnect/generated';


// Call the `deleteAllDataRef()` function to get a reference to the mutation.
const ref = deleteAllDataRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteAllDataRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.machine_delete);
console.log(data.product_delete);
console.log(data.order_delete);
console.log(data.orderItem_delete);
console.log(data.inventory_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.machine_delete);
  console.log(data.product_delete);
  console.log(data.order_delete);
  console.log(data.orderItem_delete);
  console.log(data.inventory_delete);
});
```

