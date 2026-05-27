import React, { useState, useRef } from 'react';

export default function MediaGallerySection({ carousel }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef(null);

    const images = (carousel || []).map(item =>
        typeof item === 'string'
            ? { src: item, label: '' }
            : { src: item.url || item.image || '', label: item.caption || item.name || '' }
    ).filter(i => i.src);

    if (images.length === 0) return null;

    const items = [...images, ...images];

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, clientWidth } = scrollRef.current;
        const index = Math.round(scrollLeft / clientWidth);
        setActiveIndex(index);
    };

    return (
        <section className="w-full section-padding !pt-0 overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[var(--gp-bg-page)] to-transparent z-10 pointer-events-none hidden lg:block" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[var(--gp-bg-page)] to-transparent z-10 pointer-events-none hidden lg:block" />

            {/* Desktop Animation / Mobile Scroll Container */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex gap-4 md:gap-6 items-end lg:animate-continuous-scroll lg:w-max hover:pause overflow-x-auto snap-x snap-mandatory scrollbar-none pb-8 lg:pb-0"
            >
                {items.map((item, index) => (
                    <div
                        key={index}
                        className={`group relative rounded-3xl overflow-hidden shrink-0 border border-white/20 shadow-[0_15px_30px_rgba(0,0,0,0.1)] gp-card-hover snap-center
                            ${index % 3 === 0 ? 'w-[85vw] md:w-[480px] aspect-video md:aspect-[16/10]' : 'w-[60vw] md:w-[240px] aspect-[3/4]'}
                            ml-0`}
                    >
                        <img
                            src={item.src}
                            alt={item.label}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.10]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--gp-primaryDark)]/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                        {item.label && (
                            <h3 className="absolute bottom-6 left-6 text-white gp-hero-title text-2xl md:text-3xl tracking-widest uppercase drop-shadow-md">
                                {item.label}
                            </h3>
                        )}
                    </div>
                ))}
            </div>

            {/* Scroll Indicator Dots - Mobile Only */}
            <div className="flex justify-center gap-2 mt-4 lg:hidden">
                {images.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            activeIndex % images.length === i
                                ? 'w-6 bg-[var(--gp-primary)]'
                                : 'w-1.5 bg-[var(--gp-border)]'
                        }`}
                    />
                ))}
            </div>
        </section>
    );
}
