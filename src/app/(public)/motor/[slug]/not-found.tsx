import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { dealershipCopy } from '@/content/copy/id';

export default function ModelNotFound() {
  return (
    <div className="py-20">
      <Container>
        <Card
          variant="neutral"
          padding="lg"
          className="max-w-lg mx-auto text-center border border-hairline py-12"
        >
          <div className="w-12 h-12 bg-neutral-2 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-lg">
            !
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink font-manrope mb-2">
            {dealershipCopy.catalog.modelNotFoundTitle}
          </h1>
          <p className="text-sm text-body leading-relaxed mb-6">
            {dealershipCopy.catalog.modelNotFoundDescription}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/motor">
              <Button variant="primary" size="sm">
                Lihat Semua Motor
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                {dealershipCopy.common.backToHome}
              </Button>
            </Link>
          </div>
        </Card>
      </Container>
    </div>
  );
}
