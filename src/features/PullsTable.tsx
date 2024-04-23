import { usePullRequests } from "./queries";
import type { PullRequestResource } from "./types";
import { Card } from "./ui/Card";
import { repo } from "./utils";

const formatData = (data: PullRequestResource[]) =>
  data.map((item: PullRequestResource) => ({
    branch: item.head.ref,
    id: item.number,
    state: item.state,
    title: item.title,
    user: item.user.avatar_url,
  }));

export const PullsTable = () => {
  const { data, isSuccess } = usePullRequests(repo.value);

  if (!isSuccess) {
    return null;
  }

  const pulls = formatData(data);

  return (
    <Card>
      <Card.Body>
        <table class="table">
          <thead>
            <tr>
              <th></th>
              <th>User</th>
              <th>State</th>
              <th>Branch</th>
              <th>Title</th>
            </tr>
          </thead>

          <tbody>
            {pulls.map((items) => (
              <tr>
                <td>{items.id}</td>
                <td>
                  <div class="avatar">
                    <div class="w-8 rounded-full">
                      <img src={items.user} />
                    </div>
                  </div>
                </td>
                <td>{items.state}</td>
                <td>{items.branch}</td>
                <td>{items.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card.Body>
    </Card>
  );
};
