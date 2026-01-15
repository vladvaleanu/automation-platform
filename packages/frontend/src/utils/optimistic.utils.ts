/**
 * Optimistic Update Utilities
 * Helpers for implementing optimistic UI updates with React Query
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Optimistically update a single item in a list
 */
export function optimisticUpdateItem<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: any[],
  itemId: string,
  updates: Partial<T>
): void {
  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old?.data) return old;

    return {
      ...old,
      data: old.data.map((item: T) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    };
  });
}

/**
 * Optimistically add an item to a list
 */
export function optimisticAddItem<T>(
  queryClient: QueryClient,
  queryKey: any[],
  newItem: T
): void {
  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old?.data) return old;

    return {
      ...old,
      data: [...old.data, newItem],
    };
  });
}

/**
 * Optimistically remove an item from a list
 */
export function optimisticRemoveItem<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: any[],
  itemId: string
): void {
  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old?.data) return old;

    return {
      ...old,
      data: old.data.filter((item: T) => item.id !== itemId),
    };
  });
}

/**
 * Create an optimistic mutation configuration
 * Returns onMutate, onError, and onSettled handlers for React Query
 */
export function createOptimisticMutation<TVariables, TData, TContext = any>({
  queryClient,
  queryKey,
  onMutate,
  onError,
  onSuccess,
}: {
  queryClient: QueryClient;
  queryKey: any[];
  onMutate: (variables: TVariables) => TContext;
  onError?: (error: any, variables: TVariables, context: TContext | undefined) => void;
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
}) {
  return {
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update
      const context = onMutate(variables);

      // Return context with previous data
      return { previousData, ...context } as TContext;
    },

    onError: (error: any, variables: TVariables, context: TContext | undefined) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      // Call custom error handler
      onError?.(error, variables, context);
    },

    onSuccess: (data: TData, variables: TVariables, context: TContext | undefined) => {
      // Call custom success handler
      onSuccess?.(data, variables, context);
    },

    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey });
    },
  };
}

/**
 * Example usage patterns
 */
export const OptimisticPatterns = {
  /**
   * Toggle boolean field (e.g., enabled/disabled)
   */
  toggle: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: any[],
    itemId: string,
    field: keyof T
  ) => {
    return createOptimisticMutation({
      queryClient,
      queryKey,
      onMutate: (variables: { itemId: string }) => {
        // Get current value
        const data: any = queryClient.getQueryData(queryKey);
        const item = data?.data?.find((i: T) => i.id === variables.itemId);
        const currentValue = item?.[field];

        // Optimistically toggle
        optimisticUpdateItem(queryClient, queryKey, variables.itemId, {
          [field]: !currentValue,
        } as Partial<T>);

        return { itemId: variables.itemId, previousValue: currentValue };
      },
    });
  },

  /**
   * Update status field
   */
  updateStatus: <T extends { id: string; status: string }>(
    queryClient: QueryClient,
    queryKey: any[],
    itemId: string,
    newStatus: string
  ) => {
    return createOptimisticMutation({
      queryClient,
      queryKey,
      onMutate: (variables: { itemId: string; status: string }) => {
        const data: any = queryClient.getQueryData(queryKey);
        const item = data?.data?.find((i: T) => i.id === variables.itemId);
        const previousStatus = item?.status;

        optimisticUpdateItem(queryClient, queryKey, variables.itemId, {
          status: variables.status,
        } as Partial<T>);

        return { itemId: variables.itemId, previousStatus };
      },
    });
  },

  /**
   * Delete item
   */
  delete: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: any[],
    itemId: string
  ) => {
    return createOptimisticMutation({
      queryClient,
      queryKey,
      onMutate: (variables: { itemId: string }) => {
        const data: any = queryClient.getQueryData(queryKey);
        const item = data?.data?.find((i: T) => i.id === variables.itemId);

        optimisticRemoveItem(queryClient, queryKey, variables.itemId);

        return { itemId: variables.itemId, deletedItem: item };
      },
    });
  },

  /**
   * Create item
   */
  create: <T extends { id?: string }>(
    queryClient: QueryClient,
    queryKey: any[],
    tempId: string
  ) => {
    return createOptimisticMutation({
      queryClient,
      queryKey,
      onMutate: (variables: T) => {
        const tempItem = { ...variables, id: tempId } as T & { id: string };
        optimisticAddItem(queryClient, queryKey, tempItem);

        return { tempId };
      },
      onSuccess: (data: any, variables: T, context: any) => {
        // Replace temp item with real item
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: old.data.map((item: any) =>
              item.id === context.tempId ? data : item
            ),
          };
        });
      },
    });
  },
};
