import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigModal } from "./features/ConfigModal";
import { Nav } from "./features/Nav";
import { PullRequestsTable } from "./features/PullRequestsTable";
import { Tabs } from "./features/ui/Tabs";

export const App = () => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Nav />

      <div class="container mx-auto">
        <div class="grid grid-cols-4 gap-4 mt-10">
          <Tabs defaultTab="Pull Requests">
            <Tabs.Panel name="Pull Requests">
              <PullRequestsTable />
            </Tabs.Panel>
            <Tabs.Panel name="Reviews">Reviews</Tabs.Panel>
          </Tabs>
        </div>

        <ConfigModal />
      </div>
    </QueryClientProvider>
  );
};
