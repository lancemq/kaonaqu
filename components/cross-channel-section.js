import Link from 'next/link';

export default function CrossChannelSection({ journey, variant = 'default' }) {
  if (!journey?.groups?.length) {
    return null;
  }

  return (
    <section className={`cross-channel-panel cross-channel-panel-${variant}`} aria-label={journey.title}>
      <div className="cross-channel-panel-head">
        {journey.kicker ? <p className="overview-label">{journey.kicker}</p> : null}
        <h2>{journey.title}</h2>
        {journey.summary ? <p>{journey.summary}</p> : null}
      </div>

      <div className="cross-channel-groups">
        {journey.groups.map((group) => (
          <section className="cross-channel-group" key={group.id}>
            <div className="cross-channel-group-head">
              <span>{group.label}</span>
            </div>

            <div className="cross-channel-link-stack">
              {group.items.map((item) => (
                <Link className="cross-channel-link" href={item.href} key={`${group.id}-${item.href}`}>
                  {item.meta ? <span className="cross-channel-link-meta">{item.meta}</span> : null}
                  <strong>{item.title}</strong>
                  {item.description ? <p>{item.description}</p> : null}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
