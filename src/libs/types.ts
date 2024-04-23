export interface HasChildren {
  children: JSX.Element;
}

export type PullRequest = Pick<
  PullRequestResource,
  "id" | "number" | "user"
> & {
  repo: string;
  created_at: Date;
  updated_at: Date;
};

export type PullRequestResource = {
  base: {
    repo: {
      full_name: string;
    };
  };
  created_at: string;
  head: {
    ref: string;
  };
  id: number;
  number: number;
  state: string;
  title: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
};

export type Review = {
  title: string;
};

export type UserResource = {
  avatar_url: string;
  login: string;
  name: string;
};
