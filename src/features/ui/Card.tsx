import { type ReactElement, type ReactNode } from "preact/compat";

interface CardChildProps {
  children: ReactNode;
}

interface CardProps {
  children: ReactElement<CardChildProps> | ReactElement<CardChildProps>[];
}

const Header = ({ children }: CardChildProps) => <>{children}</>;

const Body = ({ children }: CardChildProps) => (
  <div class="card-body">{children}</div>
);

const Footer = ({ children }: CardChildProps) => <>{children}</>;

/**
 * A card component with header, body, and footer sections
 */
export const Card: React.FC<CardProps> & {
  Body: React.FC<CardChildProps>;
  Header: React.FC<CardChildProps>;
  Footer: React.FC<CardChildProps>;
} = ({ children }) => {
  return <div class="card bg-base-300 shadow-xl col-span-4">{children}</div>;
};

Card.Header = Header;

Card.Body = Body;

Card.Footer = Footer;
