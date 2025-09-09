"use client";

import React from 'react';
import Link from 'next/link';

interface CaptionWithLinksProps {
    text: string;
}

export function CaptionWithLinks({ text }: CaptionWithLinksProps) {
    if (!text) return null;

    const parts = text.split(/([#@]\w+)/g);

    return (
        <p>
            {parts.map((part, index) => {
                if (part.startsWith('@')) {
                    const username = part.substring(1);
                    return (
                        <Link
                            key={index}
                            href={`/profile/${username}`}
                            className="font-medium text-primary hover:underline"
                        >
                            {part}
                        </Link>
                    );
                }
                if (part.startsWith('#')) {
                    const tag = part.substring(1);
                    return (
                        <Link
                            key={index}
                            href={`/tags/${tag}`}
                            className="font-medium text-primary hover:underline"
                        >
                            {part}
                        </Link>
                    );
                }
                return <React.Fragment key={index}>{part}</React.Fragment>;
            })}
        </p>
    );
}
