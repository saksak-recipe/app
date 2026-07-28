import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect } from 'react';

import { getMyGroup } from '@/api/groups';
import { queryKeys } from '@/api/queryKeys';
import { useScopeStore } from '@/stores/scopeStore';

function isGroupNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

export function useGroupScope() {
  const scope = useScopeStore((state) => state.scope);
  const hasGroup = useScopeStore((state) => state.hasGroup);
  const setScope = useScopeStore((state) => state.setScope);
  const setHasGroup = useScopeStore((state) => state.setHasGroup);

  const groupQuery = useQuery({
    queryKey: queryKeys.group.me,
    queryFn: getMyGroup,
    retry: false,
  });

  useEffect(() => {
    if (groupQuery.isSuccess) {
      setHasGroup(true);
      return;
    }

    if (groupQuery.isError && isGroupNotFoundError(groupQuery.error)) {
      setHasGroup(false);
    }
  }, [groupQuery.isSuccess, groupQuery.isError, groupQuery.error, setHasGroup]);

  const isGroupReady = scope === 'personal' || groupQuery.isSuccess;

  return {
    scope,
    hasGroup,
    setScope,
    setHasGroup,
    groupQuery,
    isGroupReady,
  };
}
