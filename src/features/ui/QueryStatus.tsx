import { type UseQueryResult } from "@tanstack/react-query";
import { Children, type ReactNode } from "preact/compat";
import type { HasChildren } from "../../libs/types";

type Props = {
  children: ReactNode;

  /** Tanstack Query object */
  query: UseQueryResult<unknown, Error>;

  /** Provided query data is considered 'empty' when method is true */
  isEmpty?: (arg: any) => boolean;
};

/**
 * Given a Tanstack Query and children for each state, render the child matching
 * the current state of the query
 */
export const QueryStatus = ({
  children,
  isEmpty = () => false,
  query,
}: Props) => {
  let content = null;

  // Loop through children and find the matching status component
  Children.forEach(children, (child) => {
    // @ts-expect-error: children have a type prop with the component object
    if (query.isLoading && child.type === QueryStatus.Loading) {
      content = child;
    }

    // @ts-expect-error
    if (query.isError && child.type === QueryStatus.Error) {
      content = child;
    }

    if (
      query.isSuccess &&
      isEmpty(query.data) &&
      // @ts-expect-error
      child.type === QueryStatus.Empty
    ) {
      content = child;
    }

    if (
      query.isSuccess &&
      !isEmpty(query.data) &&
      // @ts-expect-error
      child.type === QueryStatus.Success
    ) {
      content = child;
    }
  });

  return <>{content}</>;
};

QueryStatus.Loading = ({ children }: HasChildren) => <>{children}</>;

QueryStatus.Error = ({ children }: HasChildren) => <>{children}</>;

QueryStatus.Empty = ({ children }: HasChildren) => <>{children}</>;

QueryStatus.Success = ({ children }: HasChildren) => <>{children}</>;
