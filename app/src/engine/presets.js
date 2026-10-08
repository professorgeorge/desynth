// Realistic Demo Presets showcasing the 4-Pass Cognitive Engine

export const PRESETS = [
  {
    id: 'philosophy-essay',
    title: 'Philosophy & Epistemology Draft (Pairs with Bertrand Russell)',
    personaId: 'bertrand-russell',
    input: `In today's fast-paced intellectual landscape, the intricate tapestry of consciousness serves as a profound testament to the multifaceted nature of human cognition. It's not just about neural pathways; it's about the holistic paradigm of subjective being. Delving deep into Cartesian dualism, we embark on a transformative journey where matter and mind seamlessly intertwine. At its core, the problem of qualia underscores a pivotal watershed moment for epistemology. Let that sink in: could our sensory realities ultimately be nothing more than an emergent phenomenon? The future of philosophy looks bright indeed.`,
    demoSubstance: `The mind-body problem inquires whether mental events (such as sensory perceptions) can be fully explained by physical states of the nervous system. While physicalism accounts for measurable brain activity, it fails to provide a logical deduction from physiological data to subjective qualitative experience. This gap implies that either physical concepts are incomplete or mental entities constitute a separate category of relations.`,
    demoRewrite: `The relation between mind and matter remains one of the central difficulties in theory of knowledge. When light strikes the retina, a physical disturbance travels along the nerves into the brain; yet no examination of the cerebral tissue reveals the sensation of blue itself. We are acquainted directly with our private data of sense, whereas our knowledge of physical objects is inferred and precarious. It is therefore a fallacy to assume that matter is better understood than mind, or that conscious sensations can be dissolved without remainder into spatial movements.`
  },
  {
    id: 'bureaucratic-policy',
    title: 'Bureaucratic Policy Memo (Pairs with George Orwell)',
    personaId: 'george-orwell',
    input: `In order to optimize our cross-functional synergies, the executive committee has deemed it appropriate to commence an overarching review of legacy procedures. Due to the fact that current operational paradigms boast various suboptimal inefficiencies, it serves as a critical imperative that leadership utilize robust strategic levers to streamline workflows. Underscoring our comprehensive commitment to excellence, this initiative is poised to become a game-changer across the entire ecosystem. As of my last update, stakeholder alignment is paramount.`,
    demoSubstance: `The committee is reviewing office purchasing procedures because managers currently spend three weeks waiting for approvals on basic supplies. We recommend raising the petty expense threshold from $50 to $500, which will eliminate 80% of required purchase orders.`,
    demoRewrite: `We should cut the approvals needed for small purchases. Today, a manager must fill out three forms and wait three weeks to buy a ten-dollar box of printer paper. If we let department heads spend up to five hundred dollars on their own authority, we will do away with four out of five purchase orders and save hundreds of working hours every month.`
  },
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
    id: 'candid-essay',
    title: 'Technical Essay / Blog Post (Database Caching)',
    personaId: 'candid-essayist',
    input: `What if I told you that caching is not the silver bullet you think it is? Here's what's interesting: developers everywhere embark on a quest for speed, yet they find that caching actually introduces intricate complexities into their systems. In a world where data consistency is king, invalidating cache layers feels like an impossible endeavor. Think about it: every cache hit feels like magic, but every stale read is a nightmare dressed up as performance. Let that sink in. The answer isn't faster Redis clusters. It's smarter query design. Full stop.`,
    demoSubstance: `Adding a Redis cache layer often conceals inefficient SQL queries rather than fixing them. Invalidation bugs cause silent stale-read errors that are harder to debug than slow queries. Measuring index usage and rewriting two N+1 joins usually removes the need for an external caching tier entirely.`,
    demoRewrite: `Adding Redis is usually an excuse to avoid understanding an index. We spent three weeks debugging a race condition where users saw outdated account balances because our cache invalidation was firing before the database transaction committed. When we finally checked the underlying query, adding a composite index on user_id and created_at brought query execution from 850 milliseconds down to four milliseconds, making the Redis layer redundant.`
  }
];
