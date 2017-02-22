# User Archetypes

This is a bit weird because it's not a really proper product description because I'm not making a commercial project, just a pie-in-the-sky project. But if I write it out, I can point to the archetypes as why a given feature or quirk is important. I know that many of those users won't be serviced right away by rm3 and, unless it catches on, may never be adequately serviced. Some of the features they require may be custom code.

## The solo mostly-blogger
This user has the necessary technological skills to set up a cloud server with some stuff installed on it. They write content in a blog-ish form but are constrained by the existing format of blogs and want to try something different. They will have one, maybe two, editors. They want the system to mostly run without incident. They may eventually be better-served by a service integrator but many of them desire stronger control over their infrastructure. They will eventually want the ability to schedule postings in the future, to send a quick draft to a friend, a private entry. They want to be able to present a "best of", a tag/category system, and a chronological archive.

### The archivist. 
This user is seeking a solution for an online archive. They want to upload collections of items, where the items may be video, audio, photographs, or descriptions of a phsyical artifact. They want to be able to provide Dublin Core or PBCore metadata easily. They need the ability to customize the storage and display for the unique needs of their collection. They also need the ability to generate friendly web exhibits of their collection. They need the ability to do sophisticated metadata searches.

### The photographer
They have a collection of blog articles and a collection of photos, plus some standard pages for content like how to hire them and where you can buy their photos via stock. They may have collections of photos to be privately shared with clients.

### The musician
They have a collection of music for download or online play, either locally stored or via SoundCloud or YouTube. They may also use it as a notepad to share lyric sheets, lead sheets, sheet music, stems, or other such things with collaborators in a protected fashion.

### The cartoonist
They have a stream of cartoons, potentially with such features as explanatory text, screen-reader-friendly dialogue, or hover-text, or the like. They need to customize the look to match their cartoon. They may feature a blog stream that runs as a parallel section (e.g. not updated at the same time as the cartoon). They also may want a set of interesting reference information (the characters, scenes, incidents, 'if you are just joining us' sections, etc). They will be focusing users towards a page to be checked every day. They need the ability to view archives chronologically or by storyline. They want to be able to keep a forward archive of cartoons on a schedule to be automatically posted.

## The online publication
This user may have an operational staff. They may have a dedicated technical staff. Some of the people contributing content will not want to care about the underlying technology, thus explanations involving queries and optimized code and RDF and so on will annoy them. There will be multiple writers, editors and potentially some degree of an approval process. Scheduling content is important. Providing their own custom and unique 'look' to the site is important, as is customizing the codebase to their unique needs (but in a way that doesn't preclude them from benefiting from mainline updates). Operationally, they want to understand how to handle spikes in load. They require the system to be able to be scaled using an automated scaling product.

## The application developer
This user must necessarily be fairly technological. This user is building a document-based application for that fits well in the rm3 model. They are seeking a technological solution that is close enough to what they would have written on their own that any mismatches in the model represent a smaller investment in time than implementing something like rm3. They value a stable core to build on that won't have them releasing their own new versions in lock-step. They may be offering their product as a hosted service, an installer that builds infrastructure on the user's cloud, or as an installable piece of software.

## The service integrator
They have both an operational and technical staff. They want to offer rm3 and/or applications built upon rm3 to non-technical end-users as a hosted service. They want to bring their chosen degree of technology -- multi-tenant nodes, nodes with containers, orchestrated cloud nodes, or white-glove support on built-out infrastructure -- depending on the mix of customers they service. The ability to run customers on a multi-tenant pool that is so minimal that they can offer a free trial tier is important. They want to build or use tools to enable high degrees of end-user code-less custimization. They need to be able to protect users from each other on a multi-tenant install.

## The corporate internet
This user wants something like redmine or microsoft sharepoint. They need strong and easy-to-integrate permissioning and authentication. They want to install multiple rm3 applications from different sources and have them not conflict. They need strong backup and audit-logging. 

## The person being stalked or harassed
This user may be seeking to host their own instance of rm3 on a system they trust.  Alternatively, they may be a user of a shared rm3 setup or someone who is being harassed by a user on a shared rm3 setup.

Regardless, this person needs to be able to report abuse where observed.  Some abuse, e.g. DMCA takedown requests, may be legally actionable within a required period.  Other abuse may be legal but objectionable.  Service administrators need to have a trouble-free way to handle a potential flood of abuse reports, some of those reports themselves abusive.

Users need to be able to be blocked, both silently and publicly.  Users need to able to be removed, potentially in an evidence-preserving fashion.

This person may need to heavily secure their system against attackers.  The user may seek to configure a [Duress code](https://en.wikipedia.org/wiki/Duress_code) or other similar measures.
