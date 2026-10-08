// Realistic Demo Presets showcasing the 4-Pass Cognitive Engine

export const PRESETS = [
  {
    id: 'scholarly-paper',
    title: 'Scholarly Paper Abstract (Bio-informatics / ML)',
    personaId: 'scholarly-researcher',
    input: `In the rapidly evolving realm of modern computational biology, the interplay between deep learning and genomic sequencing serves as a testament to the transformative power of artificial intelligence. It's not just about algorithmic speed; it's about navigating the intricate complexities of molecular pathways. Here's the thing: traditional pipeline methodologies often struggle with high-dimensional noise, which underscores a pivotal challenge for researchers. By leveraging our novel robust framework, we delve into biological datasets to unlock seamless predictive accuracy. Furthermore, our findings showcase significant breakthroughs that could potentially revolutionize therapeutic intervention. In conclusion, the future looks bright for personalized medicine. citeturn0search0`,
    demoSubstance: `The core contribution is a machine learning model for denoising high-dimensional genomic sequence data. Existing statistical pipelines degrade in predictive accuracy when sequence depth falls below 15x. The proposed neural architecture uses sparse attention to preserve splice-junction accuracy on low-coverage reads, achieving an 8.4% improvement on the benchmark dataset.`,
    demoRewrite: `High-dimensional noise in genomic sequencing consistently degrades splice-junction prediction when read coverage drops below 15x. Existing alignment pipelines smooth over these low-coverage regions, discarding low-frequency variants. We designed a sparse-attention neural architecture that evaluates reads without global smoothing, preserving variant calls on noisy sequences. On the benchmark dataset, the model improved splice-junction identification accuracy from 74.2% to 82.6% on sub-15x depth runs.`
  },
  {
    id: 'systems-memo',
    title: 'Systems Architecture Memo (Engineering Org)',
    personaId: 'systems-engineer',
    input: `In today's fast-paced digital landscape, maintaining developer velocity is a paramount concern for modern engineering leaders. However, monolithic architectures often serve as a bottleneck, hindering rapid iteration. By embracing microservices, organizations can unlock unprecedented scalability and empower cross-functional teams to innovate seamlessly. At its core, this architectural paradigm shift is not just about code—it is about fostering a culture of agility. The kicker? Teams that embark on this journey find that their deployment bandwidth improves dramatically. Only time will tell how this transformative shift impacts the broader software ecosystem.`,
    demoSubstance: `Monolith deployment queues bottlenecked developers as team size grew past 40 engineers. A broken test in billing would block search engineers from shipping for two days. Splitting the ingest and billing workers into separate services gave each team their own deploy pipeline, cutting average queue time from four hours to twelve minutes.`,
    demoRewrite: `As the engineering team crossed forty people, our single Rails repo became the main constraint on shipping. A broken test in billing would block the search team from deploying for two days. Splitting the ingest and billing workers into separate services gave each team their own deploy pipeline, which brought average deploy queue time from four hours down to twelve minutes.`
  },
  {
    id: 'executive-memo',
    title: 'Executive Decision Memo (Product Deprecation)',
    personaId: 'executive-decision',
    input: `To be completely transparent, let me be clear: navigating legacy infrastructure is a genuinely daunting endeavor that requires a holistic strategic lens. The reality is that our v1 ingest pipeline has been a cornerstone of our technical tapestry for years, but the stakes are higher than ever. It's worth noting that while some customers deeply cherish its robust capabilities, maintaining dual environments could potentially hinder our long-term trajectory. Make no mistake: deprecating v1 represents a pivotal watershed moment that will empower our teams to double down on cutting-edge features. [Describe the specific migration timeline here].`,
    demoSubstance: `Recommendation to deprecate the v1 ingest pipeline in Q3. Three enterprise customers still send traffic to v1, but maintaining dual schemas consumes 20 engineering hours per sprint and accounts for 40% of on-call pages. Migration documentation has been shared with all three accounts.`,
    demoRewrite: `We should deprecate the v1 ingest pipeline on September 30. Three customers still route traffic through it (Acme, Velo, and NorthStar), but supporting the dual schema costs roughly twenty engineering hours every sprint and caused three of our last seven on-call pages. Engineering has prepared automated migration scripts and sent integration timelines to all three accounts.`
  },
  {
    id: 'candid-essay',
    title: 'Technical Essay / Blog Post (Database Caching)',
    personaId: 'candid-essayist',
    input: `What if I told you that caching is not the silver bullet you think it is? Here's what's interesting: developers everywhere embark on a quest for speed, yet they find that caching actually introduces intricate complexities into their systems. In a world where data consistency is king, invalidating cache layers feels like an impossible endeavor. Think about it: every cache hit feels like magic, but every stale read is a nightmare dressed up as performance. Let that sink in. The answer isn't faster Redis clusters. It's smarter query design. Full stop.`,
    demoSubstance: `Adding a Redis cache layer often conceals inefficient SQL queries rather than fixing them. Invalidation bugs cause silent stale-read errors that are harder to debug than slow queries. Measuring index usage and rewriting two N+1 joins usually removes the need for an external caching tier entirely.`,
    demoRewrite: `Adding Redis is usually an excuse to avoid understanding an index. We spent three weeks debugging a race condition where users saw outdated account balances because our cache invalidation was firing before the database transaction committed. When we finally checked the underlying query, adding a composite index on user_id and created_at brought query execution from 850 milliseconds down to four milliseconds, making the Redis layer redundant.`
  }
];
