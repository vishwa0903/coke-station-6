import { CreateAllDataData, UpdateAllDataData, DeleteAllDataData, ReadAllDataData, PublicDataData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateAllData(options?: useDataConnectMutationOptions<CreateAllDataData, FirebaseError, void>): UseDataConnectMutationResult<CreateAllDataData, undefined>;
export function useCreateAllData(dc: DataConnect, options?: useDataConnectMutationOptions<CreateAllDataData, FirebaseError, void>): UseDataConnectMutationResult<CreateAllDataData, undefined>;

export function useUpdateAllData(options?: useDataConnectMutationOptions<UpdateAllDataData, FirebaseError, void>): UseDataConnectMutationResult<UpdateAllDataData, undefined>;
export function useUpdateAllData(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateAllDataData, FirebaseError, void>): UseDataConnectMutationResult<UpdateAllDataData, undefined>;

export function useDeleteAllData(options?: useDataConnectMutationOptions<DeleteAllDataData, FirebaseError, void>): UseDataConnectMutationResult<DeleteAllDataData, undefined>;
export function useDeleteAllData(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteAllDataData, FirebaseError, void>): UseDataConnectMutationResult<DeleteAllDataData, undefined>;

export function useReadAllData(options?: useDataConnectQueryOptions<ReadAllDataData>): UseDataConnectQueryResult<ReadAllDataData, undefined>;
export function useReadAllData(dc: DataConnect, options?: useDataConnectQueryOptions<ReadAllDataData>): UseDataConnectQueryResult<ReadAllDataData, undefined>;

export function usePublicData(options?: useDataConnectQueryOptions<PublicDataData>): UseDataConnectQueryResult<PublicDataData, undefined>;
export function usePublicData(dc: DataConnect, options?: useDataConnectQueryOptions<PublicDataData>): UseDataConnectQueryResult<PublicDataData, undefined>;
