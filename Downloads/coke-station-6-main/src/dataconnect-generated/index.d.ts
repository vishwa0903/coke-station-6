import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateAllDataData {
  machine_insert: Machine_Key;
  product_insert: Product_Key;
  order_insert: Order_Key;
  orderItem_insert: OrderItem_Key;
  inventory_insert: Inventory_Key;
}

export interface DeleteAllDataData {
  machine_delete?: Machine_Key | null;
  product_delete?: Product_Key | null;
  order_delete?: Order_Key | null;
  orderItem_delete?: OrderItem_Key | null;
  inventory_delete?: Inventory_Key | null;
}

export interface Inventory_Key {
  id: UUIDString;
  __typename?: 'Inventory_Key';
}

export interface Machine_Key {
  id: UUIDString;
  __typename?: 'Machine_Key';
}

export interface OrderItem_Key {
  id: UUIDString;
  __typename?: 'OrderItem_Key';
}

export interface Order_Key {
  id: UUIDString;
  __typename?: 'Order_Key';
}

export interface Product_Key {
  id: UUIDString;
  __typename?: 'Product_Key';
}

export interface PublicDataData {
  products: ({
    name: string;
    basePrice: number;
    imageUrl?: string | null;
  })[];
}

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

export interface UpdateAllDataData {
  machine_update?: Machine_Key | null;
  product_update?: Product_Key | null;
  order_update?: Order_Key | null;
  orderItem_update?: OrderItem_Key | null;
  inventory_update?: Inventory_Key | null;
}

interface CreateAllDataRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateAllDataData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateAllDataData, undefined>;
  operationName: string;
}
export const createAllDataRef: CreateAllDataRef;

export function createAllData(): MutationPromise<CreateAllDataData, undefined>;
export function createAllData(dc: DataConnect): MutationPromise<CreateAllDataData, undefined>;

interface UpdateAllDataRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateAllDataData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdateAllDataData, undefined>;
  operationName: string;
}
export const updateAllDataRef: UpdateAllDataRef;

export function updateAllData(): MutationPromise<UpdateAllDataData, undefined>;
export function updateAllData(dc: DataConnect): MutationPromise<UpdateAllDataData, undefined>;

interface DeleteAllDataRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteAllDataData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteAllDataData, undefined>;
  operationName: string;
}
export const deleteAllDataRef: DeleteAllDataRef;

export function deleteAllData(): MutationPromise<DeleteAllDataData, undefined>;
export function deleteAllData(dc: DataConnect): MutationPromise<DeleteAllDataData, undefined>;

interface ReadAllDataRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ReadAllDataData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ReadAllDataData, undefined>;
  operationName: string;
}
export const readAllDataRef: ReadAllDataRef;

export function readAllData(options?: ExecuteQueryOptions): QueryPromise<ReadAllDataData, undefined>;
export function readAllData(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ReadAllDataData, undefined>;

interface PublicDataRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<PublicDataData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<PublicDataData, undefined>;
  operationName: string;
}
export const publicDataRef: PublicDataRef;

export function publicData(options?: ExecuteQueryOptions): QueryPromise<PublicDataData, undefined>;
export function publicData(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<PublicDataData, undefined>;

