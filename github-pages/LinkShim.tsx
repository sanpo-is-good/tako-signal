import type { AnchorHTMLAttributes } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

const BASE_PATH = "/tako-signal";

export default function Link({ href, ...props }: LinkProps) {
  const resolvedHref = /^https?:\/\//.test(href)
    ? href
    : href === "/"
      ? `${BASE_PATH}/`
      : `${BASE_PATH}${href.startsWith("/") ? href : `/${href}`}`;

  return <a href={resolvedHref} {...props} />;
}
