import type { CommonLayoutQuery, LegalPageRecord } from '@/graphql/types/graphql';
import type { ResolvedGlobalPageProps } from '@/utils/globalPageProps';
import { buildUrl } from '@/utils/globalPageProps';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

type Props = {
  data: CommonLayoutQuery;
  globalPageProps: ResolvedGlobalPageProps;
};

const Footer = ({ data, globalPageProps }: Props) => {
  return (
    <footer className="bg-[#111111] text-white">
      <div className="mx-auto max-w-[1200px] px-8 py-16">
        <div className="flex flex-col justify-between gap-12 md:flex-row">
          {/* Left: logo + tagline + social */}
          <div className="max-w-xs">
            <Link href={buildUrl(globalPageProps, '/home')} className="mb-6 inline-block">
              {data.layout?.footerLogo && (
                <Image
                  src={data.layout.footerLogo.url}
                  alt="logo"
                  width={data.layout.footerLogo.width || 120}
                  height={data.layout.footerLogo.height || 32}
                  className="h-8 w-auto brightness-0 invert"
                />
              )}
            </Link>
            {data.layout?.footerSubtitle && (
              <div className="text-sm leading-relaxed text-[#aaaaaa]">
                <ReactMarkdown>{data.layout.footerSubtitle}</ReactMarkdown>
              </div>
            )}
            {data.layout?.socialMediaLinks && data.layout.socialMediaLinks.length > 0 && (
              <div className="mt-6 flex gap-4">
                {data.layout.socialMediaLinks.map((sm) => (
                  <a
                    key={sm.id}
                    href={sm.url}
                    aria-label="social"
                    className="text-[#aaaaaa] transition-colors hover:text-white"
                  >
                    <img src={sm.icon.url} alt="" className="h-5 w-5 brightness-0 invert opacity-60 hover:opacity-100" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Right: nav columns */}
          <div className="flex gap-16">
            {/* Legal / Company links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                Company
              </h3>
              <ul className="space-y-3">
                {data.layout?.footerLinks.map((link) => {
                  const pageLink = link as LegalPageRecord;
                  return (
                    <li key={pageLink.id}>
                      <a
                        href={buildUrl(globalPageProps, `/legal/${pageLink.slug}`)}
                        className="text-sm text-[#aaaaaa] transition-colors hover:text-white"
                      >
                        {pageLink.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-[#2a2a2a] pt-8 text-center text-sm text-[#aaaaaa]">
          © {new Date().getFullYear()} Evoltron. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
