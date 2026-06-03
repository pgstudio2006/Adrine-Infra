import { PublicBookPage } from '../../../src/components/PublicBookPage';

type PageProps = { params: Promise<{ slug: string }> };

export default async function BookTenantPage({ params }: PageProps) {
  const { slug } = await params;
  return <PublicBookPage tenantSlug={slug} />;
}
