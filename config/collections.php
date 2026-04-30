<?php

/**
 * FLUXIONIC content shape.
 *
 * Pebblestack field types: text, textarea, markdown, slug, boolean, number,
 * select, datetime, url. No image/array types — photos live as `url` fields
 * pointing at /assets/... or /uploads/...; multi-value relationships are
 * denormalized onto the parent entry (e.g. up to 3 PhD students per node).
 */

return [

    // Static pages: Home (slug=home), Project, About, etc.
    'pages' => [
        'label'          => 'Pages',
        'label_singular' => 'Page',
        'icon'           => 'file',
        'route'          => '/{slug}',
        'template'       => 'page.twig',
        'order_by'       => 'updated_at DESC',
        'fields' => [
            'title'            => ['type' => 'text', 'required' => true, 'label' => 'Title'],
            'slug'             => ['type' => 'slug', 'required' => true, 'label' => 'Slug'],
            'body'             => ['type' => 'markdown', 'label' => 'Body'],
            'meta_description' => ['type' => 'textarea', 'label' => 'Meta description'],
        ],
    ],

    // Nodes (institutions). Replaces the old "Member Institutions and PIs".
    // Up to 4 PIs and 4 PhD students live on the same entry so the detail
    // page can render the PI ↔ student relationship without cross-collection
    // queries (Pebblestack themes don't have an entries() helper). Display
    // order is controlled via publish_at (legacy ordering preserved).
    'nodes' => [
        'label'          => 'Nodes and Researchers',
        'label_singular' => 'Node',
        'icon'           => 'map-pin',
        'route'          => '/nodes/{slug}',
        'template'       => 'node.twig',
        'list_template'  => 'node-list.twig',
        'list_limit'     => 100,
        'order_by'       => 'publish_at ASC',
        'fields' => [
            'title'        => ['type' => 'text', 'required' => true, 'label' => 'Node name', 'help' => 'Full institution name (e.g. "Ecole Polytechnique Fédérale de Lausanne").'],
            'slug'         => ['type' => 'slug', 'required' => true, 'label' => 'Slug'],
            'abbrev'       => ['type' => 'text', 'label' => 'Abbreviation', 'help' => 'e.g. "EPFL", "UB", "CNRS"'],
            'location'     => ['type' => 'text', 'label' => 'City'],
            'country'      => ['type' => 'text', 'label' => 'Country'],
            'logo_url'     => ['type' => 'url', 'label' => 'Institution logo URL', 'help' => 'e.g. /assets/logos/epfl.png'],
            'associates'   => ['type' => 'textarea', 'label' => 'Associated institutions', 'help' => 'Free-text list of associated institutions (CNRS Paris uses this).'],

            'pi_1_name'      => ['type' => 'text', 'label' => 'PI #1 name'],
            'pi_1_photo_url' => ['type' => 'url', 'label' => 'PI #1 photo URL'],
            'pi_2_name'      => ['type' => 'text', 'label' => 'PI #2 name'],
            'pi_2_photo_url' => ['type' => 'url', 'label' => 'PI #2 photo URL'],
            'pi_3_name'      => ['type' => 'text', 'label' => 'PI #3 name'],
            'pi_3_photo_url' => ['type' => 'url', 'label' => 'PI #3 photo URL'],
            'pi_4_name'      => ['type' => 'text', 'label' => 'PI #4 name'],
            'pi_4_photo_url' => ['type' => 'url', 'label' => 'PI #4 photo URL'],

            'student_1_name'       => ['type' => 'text', 'label' => 'PhD student #1 name'],
            'student_1_supervisor' => ['type' => 'text', 'label' => 'PhD student #1 supervisor(s)'],
            'student_1_topic'      => ['type' => 'textarea', 'label' => 'PhD student #1 topic'],
            'student_1_photo_url'  => ['type' => 'url', 'label' => 'PhD student #1 photo URL'],

            'student_2_name'       => ['type' => 'text', 'label' => 'PhD student #2 name'],
            'student_2_supervisor' => ['type' => 'text', 'label' => 'PhD student #2 supervisor(s)'],
            'student_2_topic'      => ['type' => 'textarea', 'label' => 'PhD student #2 topic'],
            'student_2_photo_url'  => ['type' => 'url', 'label' => 'PhD student #2 photo URL'],

            'student_3_name'       => ['type' => 'text', 'label' => 'PhD student #3 name'],
            'student_3_supervisor' => ['type' => 'text', 'label' => 'PhD student #3 supervisor(s)'],
            'student_3_topic'      => ['type' => 'textarea', 'label' => 'PhD student #3 topic'],
            'student_3_photo_url'  => ['type' => 'url', 'label' => 'PhD student #3 photo URL'],

            'student_4_name'       => ['type' => 'text', 'label' => 'PhD student #4 name'],
            'student_4_supervisor' => ['type' => 'text', 'label' => 'PhD student #4 supervisor(s)'],
            'student_4_topic'      => ['type' => 'textarea', 'label' => 'PhD student #4 topic'],
            'student_4_photo_url'  => ['type' => 'url', 'label' => 'PhD student #4 photo URL'],

            'meta_description' => ['type' => 'textarea', 'label' => 'Meta description'],
        ],
    ],

    // Standalone fellows directory (separate from the node detail page).
    'fellows' => [
        'label'          => 'Fellows',
        'label_singular' => 'Fellow',
        'icon'           => 'user',
        'route'          => '/fellows/{slug}',
        'template'       => 'fellow.twig',
        'list_template'  => 'fellow-list.twig',
        'list_limit'     => 200,
        'order_by'       => 'slug ASC',
        'fields' => [
            'title'      => ['type' => 'text', 'required' => true, 'label' => 'Full name'],
            'slug'       => ['type' => 'slug', 'required' => true, 'label' => 'Slug'],
            'node_slug'  => ['type' => 'text', 'label' => 'Node slug', 'help' => 'Slug of the node this fellow belongs to (e.g. "lausanne").'],
            'node_label' => ['type' => 'text', 'label' => 'Node label', 'help' => 'Human label of the node (e.g. "EPFL — Lausanne").'],
            'pi_name'    => ['type' => 'text', 'label' => 'Supervising PI'],
            'topic'      => ['type' => 'textarea', 'label' => 'Research topic'],
            'photo_url'  => ['type' => 'url', 'label' => 'Photo URL'],
            'bio'        => ['type' => 'markdown', 'label' => 'Bio'],
            'meta_description' => ['type' => 'textarea', 'label' => 'Meta description'],
        ],
    ],

    'events' => [
        'label'          => 'Events',
        'label_singular' => 'Event',
        'icon'           => 'calendar',
        'route'          => '/events/{slug}',
        'template'       => 'event.twig',
        'list_template'  => 'event-list.twig',
        'list_limit'     => 200,
        'order_by'       => 'publish_at DESC',
        'fields' => [
            'title'       => ['type' => 'text', 'required' => true, 'label' => 'Title'],
            'slug'        => ['type' => 'slug', 'required' => true, 'label' => 'Slug'],
            'starts_on'   => ['type' => 'datetime', 'label' => 'Starts on'],
            'ends_on'     => ['type' => 'datetime', 'label' => 'Ends on'],
            'location'    => ['type' => 'text', 'label' => 'Location'],
            'summary'     => ['type' => 'textarea', 'label' => 'Summary'],
            'cover_url'   => ['type' => 'url', 'label' => 'Cover image URL'],
            'body'        => ['type' => 'markdown', 'label' => 'Body'],
            'external_url' => ['type' => 'url', 'label' => 'External event URL'],
            'meta_description' => ['type' => 'textarea', 'label' => 'Meta description'],
        ],
    ],

    // Conferences | Workshops. Index shows topic / dates / location only;
    // detail page shows talks, posters, attendees, awards, photos.
    'conferences' => [
        'label'          => 'Conferences | Workshops',
        'label_singular' => 'Conference / Workshop',
        'icon'           => 'mic',
        'route'          => '/conferences/{slug}',
        'template'       => 'conference.twig',
        'list_template'  => 'conference-list.twig',
        'list_limit'     => 200,
        'order_by'       => 'publish_at DESC',
        'fields' => [
            'title'       => ['type' => 'text', 'required' => true, 'label' => 'Topic', 'help' => 'Conference / workshop title (Topic column).'],
            'slug'        => ['type' => 'slug', 'required' => true, 'label' => 'Slug'],
            'starts_on'   => ['type' => 'datetime', 'label' => 'Starts on'],
            'ends_on'     => ['type' => 'datetime', 'label' => 'Ends on'],
            'location'    => ['type' => 'text', 'label' => 'Location'],

            'talk_given'  => ['type' => 'textarea', 'label' => 'Talk given (by which fellow)'],
            'poster'      => ['type' => 'textarea', 'label' => 'Poster presented'],
            'attendees'   => ['type' => 'textarea', 'label' => 'Fellows and PIs who attended'],
            'awards'      => ['type' => 'textarea', 'label' => 'Awards won (talk or poster)'],
            'photos'      => ['type' => 'markdown', 'label' => 'Photos', 'help' => 'Markdown — embed images with ![](url).'],
            'notes'       => ['type' => 'markdown', 'label' => 'Additional notes'],
            'meta_description' => ['type' => 'textarea', 'label' => 'Meta description'],
        ],
    ],

    // Volunteering | Outreach. Index summarises; detail shows fellow's role
    // and photos pulled from the source spreadsheet's link columns.
    'outreach' => [
        'label'          => 'Volunteering | Outreach',
        'label_singular' => 'Outreach activity',
        'icon'           => 'heart',
        'route'          => '/outreach/{slug}',
        'template'       => 'outreach.twig',
        'list_template'  => 'outreach-list.twig',
        'list_limit'     => 200,
        'order_by'       => 'publish_at DESC',
        'fields' => [
            'title'       => ['type' => 'text', 'required' => true, 'label' => 'Activity title'],
            'slug'        => ['type' => 'slug', 'required' => true, 'label' => 'Slug'],
            'date_on'     => ['type' => 'datetime', 'label' => 'Date'],
            'location'    => ['type' => 'text', 'label' => 'Location'],
            'fellow_name' => ['type' => 'text', 'label' => 'Fellow'],
            'role'        => ['type' => 'textarea', 'label' => 'Role'],
            'summary'     => ['type' => 'textarea', 'label' => 'Summary'],
            'photos'      => ['type' => 'markdown', 'label' => 'Photos', 'help' => 'Markdown — embed images with ![](url).'],
            'body'        => ['type' => 'markdown', 'label' => 'Body'],
            'meta_description' => ['type' => 'textarea', 'label' => 'Meta description'],
        ],
    ],

    // News + Publications share one collection so the News index page can
    // render publications inline without a cross-collection Twig helper.
    // The list template filters by `kind`.
    'news' => [
        'label'          => 'News',
        'label_singular' => 'News / Publication',
        'icon'           => 'rss',
        'route'          => '/news/{slug}',
        'template'       => 'news.twig',
        'list_template'  => 'news-list.twig',
        'list_limit'     => 500,
        'order_by'       => 'publish_at DESC',
        'fields' => [
            'title'       => ['type' => 'text', 'required' => true, 'label' => 'Title'],
            'slug'        => ['type' => 'slug', 'required' => true, 'label' => 'Slug'],
            'kind'        => [
                'type' => 'select',
                'required' => true,
                'label' => 'Kind',
                'options' => ['news' => 'News article', 'publication' => 'Publication'],
                'help' => 'Publications render in the italics format inside the News page; news articles render as cards.',
            ],
            'summary'     => ['type' => 'textarea', 'label' => 'Summary (news only)'],
            'cover_url'   => ['type' => 'url', 'label' => 'Cover image URL (news only)'],
            'body'        => ['type' => 'markdown', 'label' => 'Body (news only)'],

            'authors'         => ['type' => 'textarea', 'label' => 'Authors (publication only)', 'help' => 'Free text — exact author list as it should display.'],
            'bold_names'      => ['type' => 'text', 'label' => 'Names to bold (publication only)', 'help' => 'Semicolon-separated list of FLUXIONIC fellow / PI names that should appear bold inside Authors.'],
            'journal'         => ['type' => 'text', 'label' => 'Journal (publication only)'],
            'year'            => ['type' => 'number', 'label' => 'Year (publication only)'],
            'publication_url' => ['type' => 'url', 'label' => 'Publication URL (publication only)'],

            'meta_description' => ['type' => 'textarea', 'label' => 'Meta description'],
        ],
    ],

    'contact' => [
        'label'          => 'Contact',
        'label_singular' => 'Submission',
        'is_form'        => true,
        'fields' => [
            'name'    => ['type' => 'text', 'required' => true, 'label' => 'Name'],
            'email'   => ['type' => 'text', 'required' => true, 'label' => 'Email'],
            'message' => ['type' => 'textarea', 'required' => true, 'label' => 'Message'],
        ],
    ],

];
