import { FiExternalLink } from 'react-icons/fi';

export default function StoreExtrasSection({ extras, purchaseLinks = [] }) {
  if (!extras && purchaseLinks.length === 0) return null;

  const dlcItems   = extras?.dlcList?.length   > 0 ? extras.dlcList   : (extras?.proFeatures || []).map(t => ({ title: t }));
  const awardItems = extras?.awardList?.length  > 0 ? extras.awardList : (extras?.bonuses     || []).map(t => ({ award: t }));

  return (
    <section className="gp-content-section !pt-0">

      {/* Store Links */}
      {purchaseLinks.length > 0 && (
        <div className="mb-16 gp-animate-in">
          <div className="flex items-center gap-4 mb-8">
            <h3 className="gp-section-heading !border-0 !mb-0 !pb-0 text-[18px]">
              STORE LINKS
            </h3>
            <div className="h-[1px] flex-1 bg-[var(--theme-border)]" />
          </div>
          <div className="flex flex-wrap gap-4">
            {purchaseLinks.map((link, i) => (
              <a
                key={i}
                href={link.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-8 py-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-section)] transition-all hover:-translate-y-1 hover:border-[var(--gp-primary)] hover:bg-[var(--theme-card)] hover:shadow-sm group"
              >
                <span className="font-black text-[13px] uppercase tracking-widest text-[var(--theme-text)]">{link.platform}</span>
                {link.price && (
                  <span className="text-[11px] font-bold text-[var(--gp-primary)] border-l border-[var(--theme-border)] pl-4">
                    {link.price}
                  </span>
                )}
                <FiExternalLink size={14} className="text-[var(--theme-text-subtle)] group-hover:text-[var(--gp-primary)] transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* DLC & Extras */}
        {dlcItems.length > 0 && (
          <div className="gp-card bg-[var(--gp-primary)] border-transparent text-[var(--theme-text-inverse)] gp-animate-in relative group">
            <h4 className="gp-hero-title text-[26px] text-[var(--theme-text-inverse)] mb-10 relative z-10 border-b border-white/20 pb-6 uppercase tracking-tight">
              DLC &amp; EXTRAS
            </h4>

            <div className="relative z-10">
              {dlcItems.map((item, i) => (
                <div key={i} style={{ display:'flex', flexDirection:'column', gap:2, paddingBottom:10, borderBottom:'1px solid rgba(255,255,255,0.1)', marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontWeight:700, fontSize:13 }}>{item.title}</span>
                    {item.price && <span style={{ fontSize:11, opacity:0.7 }}>{item.price}</span>}
                  </div>
                  {item.type && <span style={{ fontSize:10, opacity:0.5, textTransform:'uppercase', letterSpacing:'0.06em' }}>{item.type}{item.releaseDate ? ` · ${item.releaseDate}` : ''}</span>}
                  {item.description && <p style={{ fontSize:12, opacity:0.75, margin:0 }}>{item.description}</p>}
                  {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:'rgba(255,255,255,0.6)', textDecoration:'none' }}>View in store →</a>}
                </div>
              ))}
            </div>

            <div className="mt-12 relative z-10">
              <button className="px-8 py-4 bg-[var(--theme-text-inverse)] text-[var(--gp-primary)] text-[11px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] shadow-md flex items-center gap-3 w-fit">
                VIEW ALL DLC <span className="font-serif text-[16px] leading-none">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Awards & Achievements */}
        {awardItems.length > 0 && (
          <div
            className="gp-card gp-animate-in relative group"
            style={{ animationDelay: '150ms' }}
          >
            <div className="flex items-center gap-4 mb-10 border-b border-[var(--theme-border)] pb-6 relative z-10">
              <h4 className="gp-hero-title text-[26px] text-[var(--theme-text)] uppercase tracking-tight">
                AWARDS &amp; ACHIEVEMENTS
              </h4>
            </div>

            <div className="relative z-10">
              {awardItems.map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, paddingBottom:10, borderBottom:'1px solid var(--theme-border)', marginBottom:10 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--gp-primary)', marginTop:4, flexShrink:0 }} />
                  <div>
                    <p style={{ fontWeight:700, fontSize:13, margin:0, color:'var(--theme-text)' }}>{item.award}</p>
                    {(item.organisation || item.year) && (
                      <p style={{ fontSize:11, color:'var(--theme-text-muted)', margin:'2px 0 0' }}>
                        {[item.organisation, item.year].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 relative z-10 flex items-center justify-between border-t border-[var(--theme-border)] pt-8">
              <span className="text-[11px] font-black uppercase tracking-widest text-[var(--gp-primary)]">COMMUNITY RECOGNITION</span>
              <div className="w-2 h-2 bg-[var(--gp-primary)] rounded-full animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
