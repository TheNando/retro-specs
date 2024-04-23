import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "./ui/Card";
import { repo, user } from "../libs/utils";
import { usePrStatsQuery } from "./usePrStats";

export const PullRequestsTable = () => {
  const { data, isSuccess } = usePrStatsQuery(repo.value);

  return (
    <Card>
      <Card.Body>
        <ResponsiveContainer width="100%" height={600}>
          {!isSuccess ? (
            <div>{repo.value ? "Loading" : "Enter a repo"}</div>
          ) : (
            <BarChart data={data} barCategoryGap={2}>
              <XAxis angle={-45} dataKey="name" height={70} textAnchor="end" />
              <YAxis dataKey="prs" />
              <Tooltip />
              <Bar dataKey="prs">
                {data.map((entry) => (
                  <Cell
                    fill={
                      entry.name === user.value.login ? "#005599" : "#7480ff"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
};
