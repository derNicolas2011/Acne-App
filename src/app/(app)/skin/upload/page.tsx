import { PageBody, PageHeader } from '@/components/shared/page-header';
import { SkinCapture } from '@/components/skin/skin-capture';

export const metadata = { title: 'Neues Foto' };

export default function UploadPage() {
  return (
    <>
      <PageHeader title="Hautfoto" backHref="/skin" />
      <PageBody>
        <SkinCapture />
      </PageBody>
    </>
  );
}
