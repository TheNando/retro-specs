import { useSignal } from "@preact/signals";
import React, {
  Children,
  type ReactElement,
  type ReactNode,
} from "preact/compat";

interface PanelProps {
  name: string;
  children: Exclude<ReactNode, undefined>;
}

interface TabsProps {
  children: ReactElement<PanelProps> | ReactElement<PanelProps>[];
  defaultTab: string;
}

const Panel: React.FC<PanelProps> = ({ children }) => <>{children}</>;

export const Tabs: React.FC<TabsProps> & { Panel: React.FC<PanelProps> } = ({
  children,
  defaultTab,
}) => {
  const active = useSignal(defaultTab);
  let activeTab: ReactNode = null;

  return (
    <>
      <div role="tablist" class="tabs tabs-boxed col-span-2 items-center px-2">
        {Children.map(children, (child) => {
          // @ts-expect-error: child has a type attribute
          if (child?.type !== Panel) {
            throw new Error("Tabs only accepts Tabs.Panel as children");
          }

          // @ts-expect-error: child has a name prop
          const name = child.props.name;

          if (name === active.value) {
            activeTab = child;
          }

          return (
            <a
              class={`tab ${name === active.value ? "tab-active" : ""}`}
              onClick={() => (active.value = name)}
              role="tab"
            >
              {name}
            </a>
          );
        })}
      </div>

      {activeTab}
    </>
  );
};

Tabs.Panel = Panel;
