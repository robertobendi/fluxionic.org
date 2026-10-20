<?php
/**
 * Seed FLUXIONIC content into Pebblestack's SQLite database.
 *
 * Usage:  php scripts/seed-fluxionic.php
 *
 * Idempotent: deletes existing entries from each seeded collection before
 * inserting, so re-running gives you a clean reset.
 */

declare(strict_types=1);

$root = dirname(__DIR__);
require $root . '/vendor/autoload.php';

use Pebblestack\Core\Database;
use Pebblestack\Services\Migrator;

$db = new Database($root . '/data/pebblestack.sqlite');
(new Migrator($db, $root . '/data/migrations'))->run();

/* -------------------------------------------------------------------------
 * helpers
 * ----------------------------------------------------------------------- */
function ts(string $iso): int { return (int) strtotime($iso); }

/** Return the public path for a fellow photo when the file exists, else "". */
function fellow_photo(string $rootDir, string $slug): string
{
    return is_file("{$rootDir}/assets/fellows/{$slug}.jpg")
        ? "/assets/fellows/{$slug}.jpg"
        : '';
}

/**
 * Build markdown image tags for a gallery, scanning two locations:
 *   - assets/galleries/{slug}/   — version-controlled, ships with the repo
 *                                  (curated content seeded on every deploy).
 *   - uploads/galleries/{slug}/  — runtime drop-in: add photos on the server
 *                                  and re-run the seed without a redeploy.
 * Alphabetical filenames control display order (01.jpg, 02.jpg, ...). Images
 * from both folders are merged (assets first). Returns "" when none exist.
 */
function gallery_markdown(string $rootDir, string $slug): string
{
    $out = [];
    foreach (['assets', 'uploads'] as $base) {
        $dir = "{$rootDir}/{$base}/galleries/{$slug}";
        if (!is_dir($dir)) {
            continue;
        }
        $files = glob("{$dir}/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", GLOB_BRACE) ?: [];
        sort($files, SORT_NATURAL | SORT_FLAG_CASE);
        foreach ($files as $abs) {
            $name = basename($abs);
            $alt = pathinfo($name, PATHINFO_FILENAME);
            $out[] = "![{$alt}](/{$base}/galleries/{$slug}/{$name})";
        }
    }
    return implode("\n\n", $out);
}

/**
 * Refuse to seed any entry whose data references the team's internal Google
 * Drive. Folders under drive.google.com are how FLUXIONIC organises social-
 * media content and must never be linked from the public site — embed images
 * via gallery_markdown() instead.
 */
function assert_no_private_links(string $collection, string $slug, array $data): void
{
    array_walk_recursive($data, function ($v) use ($collection, $slug) {
        if (is_string($v) && stripos($v, 'drive.google.com') !== false) {
            fwrite(STDERR, "ABORT: {$collection}/{$slug} references drive.google.com — embed images via gallery_markdown() instead.\n");
            exit(1);
        }
    });
}

function insert_entry(Database $db, string $collection, string $slug, array $data, int $publishAt): void
{
    assert_no_private_links($collection, $slug, $data);
    $now = time();
    $db->run(
        'INSERT INTO entries (collection, slug, status, data, publish_at, created_at, updated_at)
         VALUES (:c, :s, :st, :d, :p, :ca, :ua)',
        [
            'c' => $collection,
            's' => $slug,
            'st' => 'published',
            'd' => json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            'p' => $publishAt,
            'ca' => $now,
            'ua' => $now,
        ]
    );
}

$collections = ['pages', 'nodes', 'fellows', 'events', 'conferences', 'outreach', 'news'];
foreach ($collections as $c) {
    $db->run('DELETE FROM entries WHERE collection = :c', ['c' => $c]);
}
echo "Cleared existing entries in: " . implode(', ', $collections) . "\n";

/* -------------------------------------------------------------------------
 * Site name
 * ----------------------------------------------------------------------- */
$db->run(
    "INSERT INTO settings (key, value) VALUES ('site_name', 'FLUXIONIC')
     ON CONFLICT(key) DO UPDATE SET value = excluded.value"
);

/* -------------------------------------------------------------------------
 * Pages
 * ----------------------------------------------------------------------- */
insert_entry($db, 'pages', 'project', [
    'title' => 'Project',
    'slug'  => 'project',
    'body'  => "## Summary\n\n"
        . "Controlling transport of liquid matter through channels with dimensions from Ångströms to nanometres is a key challenge in many areas of science and engineering. However, progress in this field is hampered by our lack of understanding, as the conventional macroscopic description of transport phenomena breaks down.\n\n"
        . "The transition to studying nanoscale systems is not simply a matter of scaling down the approaches and methods that work for microscopic counterparts: at the nanoscale, new physics emerges due to the enhanced fluctuations, prevalence of surfaces and granularity of the matter at this scale.\n\n"
        . "Therefore, the atomistic description becomes crucial, and novel simulation and experimental tools need to be developed coupling quantum-level and force-field molecular simulations to mesoscale modelling based on continuum hydrodynamics, and to experiments that can probe such nanoscale effects.\n\n"
        . "The emerging field promises huge technological and socio-economic impact. However, it is essential to train a new generation of early-stage researchers in the diverse skills that are needed to develop and apply precisely controlled nanofluidic mass transport.\n\n"
        . "This, in a few words, is the aim of the FLUXIONIC programme: bridging Physics, Chemistry, Materials Science, and emerging nanoscale technologies.\n\n"
        . "Recent exciting developments in experimental and theoretical methods to study transport of fluids and charged particles at the nanoscale mean that we are now at a stage where exploration of key processes is viable and fundamental and applied breakthroughs can be expected from our research programme, which is probing different aspects of non-equilibrium physics in nanoconfinement.\n\n"
        . "## Work packages\n\n"
        . "![Work packages](/assets/images/work-packages.png)\n",
    'meta_description' => 'FLUXIONIC is a Marie Skłodowska-Curie Doctoral Network on nanofluidics, ionic transport, and machine-learning-driven simulation.',
], ts('2025-01-01'));

/* -------------------------------------------------------------------------
 * Nodes — order matches the legacy slatestack Members page.
 * publish_at is a sequence (later index = later in the list when sorted ASC).
 * ----------------------------------------------------------------------- */
$node_base = ts('2025-01-01');

$yann_description = 'Two-phase flow in porous media — investigating how immiscible fluids organise, fluctuate, and dissipate energy under steady driving. '
    . 'The project uses 3D-printed fluidic cells and optical measurements to study the spatial distribution of phases, flow-field fluctuations, and pressure response in model porous networks. '
    . 'The aim is to better understand which physical and geometrical parameters control the behaviour of steady two-phase flow in controlled porous media.';

$lauriane_description = 'Liquid liquid phase separations are a ubiquitous process in many natural processes. '
    . 'Examples include the formation of protein condensates inside cells, which regulate gene expression and cellular organization, and the nucleation of amorphous carbonate in coccolith vesicles of marine microalgae. '
    . 'Such environment are characterized by confined geometries, which means steric constraints limit molecular mobility and the high surface-to-volume ratio enhances interfacial effects. '
    . 'In such environments, deviations from bulk behaviour are expected. Theories predict that stability domains in confinement differ from bulk. '
    . 'Confinement should therfore be treated as a thermodynamic parameter and not only a simple boundary conditions. '
    . 'We use a surface force balance to study how nanoconfinement induces demixing in mixtures of simple molecular liquids. '
    . 'We developed a method to map concentration variations of nanoconfined fluids to identify how the equilibrium phases of a demixed mixture in confinement differ from those in bulk. '
    . 'With surface force measurements, we investigate the interplay between wetting transitions and confinement induced phase separation.';

$nodes = [
    [
        'slug' => 'barcelona',
        'data' => [
            'title' => 'University of Barcelona',
            'slug' => 'barcelona',
            'abbrev' => 'UB',
            'location' => 'Barcelona', 'country' => 'Spain',
            'logo_url' => '/assets/logos/ub.png',
            'pi_1_name' => 'Ignacio Pagonabarraga', 'pi_1_photo_url' => '/assets/pis/pagonabarraga.jpg',
            'pi_2_name' => 'Jure Dobnikar',         'pi_2_photo_url' => '/assets/pis/dobnikar.jpg',

            'student_1_name' => 'Gabriele Dalla Valle',
            'student_1_supervisor' => 'Ignacio Pagonabarraga',
            'student_1_topic' => 'Theoretical analysis of entropic transport in the nanoscale — analytic models and coarse-grained simulations of complex fluids across corrugated channels, exploring how dynamical correlations of dissolved species and heterogeneous substrates shape transport, accumulation and rectification at the nanoscale.',
            'student_1_photo_url' => '/assets/fellows/gabriele-dalla-valle.jpg',

            'student_2_name' => 'Daniel La Valle',
            'student_2_supervisor' => 'Ignacio Pagonabarraga',
            'student_2_topic' => 'Theoretical analysis of electrokinetics in confined microgels — analytic and coarse-grained models of soft, deformable colloidal gel particles, focusing on the interplay between internal degrees of freedom and the dynamics of the surrounding solvent and ionic distributions.',
            'student_2_photo_url' => '/assets/fellows/daniel-la-valle.jpg',
        ],
    ],
    [
        'slug' => 'cnrs-paris',
        'data' => [
            'title' => 'CNRS Paris',
            'slug' => 'cnrs-paris',
            'abbrev' => 'CNRS',
            'location' => 'Paris', 'country' => 'France',
            'logo_url' => '/assets/logos/cnrs.png',
            'associates' => 'École Normale Supérieure-PSL · Sorbonne Université · Université Paris-Saclay',

            'pi_1_name' => 'Marie-Laure Bocquet', 'pi_1_photo_url' => '/assets/pis/ml-bocquet.jpg',
            'pi_2_name' => 'Lydéric Bocquet',     'pi_2_photo_url' => '/assets/pis/l-bocquet.jpg',
            'pi_3_name' => 'Benjamin Rotenberg',  'pi_3_photo_url' => '/assets/pis/rotenberg.jpg',
            'pi_4_name' => 'Emmanuel Trizac',     'pi_4_photo_url' => '/assets/pis/trizac.jpg',

            'student_1_name' => 'Valentino Sanguinetti',
            'student_1_supervisor' => 'Marie-Laure Bocquet & Lydéric Bocquet',
            'student_1_topic' => 'Theoretical reactivity of MXene-electrolyte interfaces — realistic simulations of the solid/liquid interface at the electronic (quantum) scale, probing how electrons of the metallic MXene interact with ions and small molecules in the aqueous solvent. Carried out in close collaboration with the Micromegas experimental team at LPENS.',
            'student_1_photo_url' => '/assets/fellows/valentino-sanguinetti.jpg',

            'student_2_name' => 'Megh Dutta',
            'student_2_supervisor' => 'Benjamin Rotenberg & Emmanuel Trizac',
            'student_2_topic' => 'Controlling charge dynamics and flow in nanocapacitors — optimising the time dependence of externally applied voltages in nanocapacitors, drawing inspiration from "shortcuts to adiabaticity" through analytical theory combined with molecular dynamics and mesoscopic lattice simulations.',
            'student_2_photo_url' => '/assets/fellows/megh-dutta.jpg',
        ],
    ],
    [
        'slug' => 'bochum',
        'data' => [
            'title' => 'Ruhr Universität Bochum',
            'slug' => 'bochum',
            'abbrev' => 'RUB',
            'location' => 'Bochum', 'country' => 'Germany',
            'logo_url' => '/assets/logos/rub.png',
            'pi_1_name' => 'Marialore Sulpizi', 'pi_1_photo_url' => '/assets/pis/sulpizi.jpg',

            'student_1_name' => 'Mattia Borriello',
            'student_1_supervisor' => 'Marialore Sulpizi',
            'student_1_topic' => 'Molecular dynamics simulations of nanoscale water confinement and transport — ab initio and machine-learning-potential MD investigating fluid dynamics in nano-confinement, with explicit treatment of metallicity, local charges, and protonation/deprotonation in artificial fluidic devices and biological channels.',
            'student_1_photo_url' => '/assets/fellows/mattia-borriello.jpg',
        ],
    ],
    [
        'slug' => 'berlin',
        'data' => [
            'title' => 'Freie Universität Berlin',
            'slug' => 'berlin',
            'abbrev' => 'FUB',
            'location' => 'Berlin', 'country' => 'Germany',
            'logo_url' => '/assets/logos/fub.jpg',
            'pi_1_name' => 'Roland Netz', 'pi_1_photo_url' => '/assets/pis/netz.jpg',

            'student_1_name' => 'Haoyuan Quan',
            'student_1_supervisor' => 'Roland Netz',
            'student_1_topic' => 'Theoretical prediction of non-linear spectroscopy and non-Markovian friction of confined fluids — combining ab initio and force-field MD with analytical models to predict surface-sensitive vibrational spectra and extract frequency-dependent friction between liquids and confining surfaces.',
            'student_1_photo_url' => '/assets/fellows/haoyuan-quan.jpg',
        ],
    ],
    [
        'slug' => 'mpg-mainz',
        'data' => [
            'title' => 'Max Planck Gesellschaft',
            'slug' => 'mpg-mainz',
            'abbrev' => 'MPG',
            'location' => 'Mainz', 'country' => 'Germany',
            'logo_url' => '/assets/logos/mpi.png',
            'pi_1_name' => 'Mischa Bonn', 'pi_1_photo_url' => '/assets/pis/bonn.jpg',

            'student_1_name' => 'Yucong Chen',
            'student_1_supervisor' => 'Mischa Bonn',
            'student_1_topic' => 'Characterizing and controlling water structure and dynamics in confinement — using 2D-IR and sum-frequency-generation (SFG) spectroscopy to probe orientational dynamics, hydrogen-bonding structure and the effect of confinement, ions and flow on water structure.',
            'student_1_photo_url' => '/assets/fellows/yucong-chen.jpg',
        ],
    ],
    [
        'slug' => 'sweetch',
        'data' => [
            'title' => 'Sweetch Energy',
            'slug' => 'sweetch',
            'abbrev' => 'SWEETCH',
            'location' => 'Paris', 'country' => 'France',
            'associates' => 'University of Montpellier (Institut Européen des Membranes)',
            'logo_url' => '/assets/logos/sweetch.png',
            'pi_1_name' => 'Pascal Le Mélinaire', 'pi_1_photo_url' => '/assets/pis/lemelinaire.jpg',

            'student_1_name' => 'Hamza El Assri',
            'student_1_supervisor' => 'Mikhael Bechelany & Lydéric Bocquet',
            'student_1_topic' => 'Experimental and modelling investigation of a nanofluidic osmotic energy generator — combining experiments and computational simulations to identify and model the interactions among parameters governing osmotic energy generation in cell-pair units of anion- and cation-exchange membranes.',
            'student_1_photo_url' => '/assets/fellows/hamza-el-assri.jpg',
        ],
    ],
    [
        'slug' => 'ntnu',
        'data' => [
            'title' => 'Norges Teknisk-Naturvitenskapelige Universitet',
            'slug' => 'ntnu',
            'abbrev' => 'NTNU',
            'location' => 'Trondheim', 'country' => 'Norway',
            'logo_url' => '/assets/logos/ntnu.png',
            'pi_1_name' => 'Erika Eiser', 'pi_1_photo_url' => '/assets/pis/eiser.jpg',

            'student_1_name' => 'Yann Dumay',
            'student_1_supervisor' => 'Erika Eiser',
            'student_1_topic' => $yann_description,
            'student_1_photo_url' => '/assets/fellows/yann-dumay.jpg',
        ],
    ],
    [
        'slug' => 'tu-delft',
        'data' => [
            'title' => 'TU Delft',
            'slug' => 'tu-delft',
            'abbrev' => 'TUD',
            'location' => 'Delft', 'country' => 'Netherlands',
            'logo_url' => '/assets/logos/tudelft.png',
            'pi_1_name' => 'Claire Chassagne', 'pi_1_photo_url' => '/assets/pis/chassagne.jpg',
            'pi_2_name' => 'Remco Hartkamp',   'pi_2_photo_url' => '/assets/pis/hartkamp.jpg',

            'student_1_name' => 'Gökmen Tamer Sanli',
            'student_1_supervisor' => 'Claire Chassagne',
            'student_1_topic' => 'Coupling mean-field colloidal models and MD to probe surface/water interfaces — applying dielectric spectroscopy, electroacoustics, electroosmosis and Kerr-effect measurements to clay and silica systems, and coupling colloidal models with MD simulations of charged silica interfaces.',
            'student_1_photo_url' => '/assets/fellows/gokmen-tamer-sanli.jpg',
        ],
    ],
    [
        'slug' => 'cambridge',
        'data' => [
            'title' => 'University of Cambridge',
            'slug' => 'cambridge',
            'abbrev' => 'UCAM',
            'location' => 'Cambridge', 'country' => 'United Kingdom',
            'logo_url' => '/assets/logos/cambridge.jpg',
            'pi_1_name' => 'Angelos Michaelides', 'pi_1_photo_url' => '/assets/pis/michaelides.jpg',
            'pi_2_name' => 'Daan Frenkel',         'pi_2_photo_url' => '/assets/pis/frenkel.jpg',

            'student_1_name' => 'Shu Yang',
            'student_1_supervisor' => 'Angelos Michaelides',
            'student_1_topic' => 'Accurate quantum simulations of nanoconfined salty water — ML-potential MD with enhanced sampling to map out the phase diagram of neat and salty nano-confined water, probing interfacial structure, hydrogen bonding, melting behaviour, and the role of salt ions in viscosity and flow.',
            'student_1_photo_url' => '/assets/fellows/shu-yang.jpg',
        ],
    ],
    [
        'slug' => 'manchester',
        'data' => [
            'title' => 'University of Manchester',
            'slug' => 'manchester',
            'abbrev' => 'UNIMAN',
            'location' => 'Manchester', 'country' => 'United Kingdom',
            'logo_url' => '/assets/logos/manchester.gif',
            'pi_1_name' => 'Radha Boya', 'pi_1_photo_url' => '/assets/pis/boya.jpg',

            'student_1_name' => 'Sabiar Rahaman',
            'student_1_supervisor' => 'Radha Boya',
            'student_1_topic' => 'Confined water and ions in angstrom-scale capillaries — sub-nanometre 2D-material capillaries to study water structure and ion selectivity between monovalent ions of similar hydrated diameter, with theoretical analysis in collaboration with Cambridge and CNRS Paris.',
            'student_1_photo_url' => '/assets/fellows/sabiar-rahaman.jpg',
        ],
    ],
    [
        'slug' => 'oxford',
        'data' => [
            'title' => 'University of Oxford',
            'slug' => 'oxford',
            'abbrev' => 'UOXF',
            'location' => 'Oxford', 'country' => 'United Kingdom',
            'logo_url' => '/assets/logos/oxford.jpg',
            'pi_1_name' => 'Susan Perkin', 'pi_1_photo_url' => '/assets/pis/perkin.jpg',

            'student_1_name' => 'Lauriane Pierrot-Deseilligny',
            'student_1_supervisor' => 'Susan Perkin',
            'student_1_topic' => $lauriane_description,
            'student_1_photo_url' => '/assets/fellows/lauriane-pierrot-deseilligny.jpg',
        ],
    ],
    [
        'slug' => 'epfl',
        'data' => [
            'title' => 'École Polytechnique Fédérale de Lausanne',
            'slug' => 'epfl',
            'abbrev' => 'EPFL',
            'location' => 'Lausanne', 'country' => 'Switzerland',
            'logo_url' => '/assets/logos/epfl.png',
            'pi_1_name' => 'Michele Ceriotti', 'pi_1_photo_url' => '/assets/pis/ceriotti.jpg',
            'pi_2_name' => 'Sara Bonella',     'pi_2_photo_url' => '/assets/pis/bonella.jpg',

            'student_1_name' => 'Alessandro Forina',
            'student_1_supervisor' => 'Michele Ceriotti',
            'student_1_topic' => 'Machine-learning modelling for nanoconfined aqueous systems — extending data-driven surrogate models of quantum-mechanical calculations (ML potentials and dielectric-response models) to capture the long-range electrostatics essential for confined aqueous systems, including water in nanostructured silica.',
            'student_1_photo_url' => '/assets/fellows/alessandro-forina.jpg',

            'student_2_name' => 'Paula Sierra i Varela',
            'student_2_supervisor' => 'Sara Bonella',
            'student_2_topic' => 'Non-equilibrium simulations of charge transport in confined environments — adapting recent algorithms for ionic Hall effect and superionic-water dynamics to confined geometries, with emphasis on accurate inclusion of polarisation in electrodes and electrolytes for greener energy technologies.',
            'student_2_photo_url' => '/assets/fellows/paula-sierra-varela.jpg',
        ],
    ],
];

// Strip student photo URLs whose underlying file doesn't exist on disk
// so the templates render cleanly until the user drops photos into
// assets/fellows/.
foreach ($nodes as &$n) {
    foreach (range(1, 4) as $i) {
        $key = "student_{$i}_photo_url";
        if (isset($n['data'][$key]) && preg_match('#^/assets/fellows/(.+)\.jpg$#', $n['data'][$key], $m)) {
            $n['data'][$key] = fellow_photo($root, $m[1]);
        }
    }
}
unset($n);

foreach ($nodes as $i => $n) {
    insert_entry($db, 'nodes', $n['slug'], $n['data'], $node_base + $i);
}
echo "Inserted " . count($nodes) . " nodes.\n";

/* -------------------------------------------------------------------------
 * Fellows (the standalone Fellows directory).
 * Each fellow links back to a node via node_slug.
 * ----------------------------------------------------------------------- */
$fellows = [
    ['mattia-borriello',          'Mattia Borriello',         'bochum',     'Ruhr Universität Bochum',                     'Marialore Sulpizi',                      'Molecular dynamics simulations of nanoscale water confinement and transport.'],
    ['gabriele-dalla-valle',      'Gabriele Dalla Valle',     'barcelona',  'University of Barcelona',                     'Ignacio Pagonabarraga',                  'Theoretical analysis of entropic transport in the nanoscale.'],
    ['daniel-la-valle',           'Daniel La Valle',          'barcelona',  'University of Barcelona',                     'Ignacio Pagonabarraga',                  'Theoretical analysis of electrokinetics in confined microgels.'],
    ['haoyuan-quan',              'Haoyuan Quan',             'berlin',     'Freie Universität Berlin',                    'Roland Netz',                            'Theoretical prediction of non-linear spectroscopy and non-Markovian friction of confined fluids.'],
    ['valentino-sanguinetti',     'Valentino Sanguinetti',    'cnrs-paris', 'CNRS — ENS Paris',                            'Marie-Laure Bocquet & Lydéric Bocquet',  'Theoretical reactivity of MXene-electrolyte interfaces.'],
    ['megh-dutta',                'Megh Dutta',               'cnrs-paris', 'CNRS — Sorbonne Université',                  'Benjamin Rotenberg & Emmanuel Trizac',   'Controlling charge dynamics and flow in nanocapacitors.'],
    ['alessandro-forina',         'Alessandro Forina',        'epfl',       'EPFL — COSMO Lab',                            'Michele Ceriotti',                       'Machine-learning modelling for nanoconfined aqueous systems.'],
    ['paula-sierra-varela',       'Paula Sierra i Varela',    'epfl',       'EPFL — CECAM',                                'Sara Bonella',                           'Non-equilibrium simulations of charge transport in confined environments.'],
    ['yann-dumay',                'Yann Dumay',               'ntnu',       'NTNU — PoreLab',                              'Erika Eiser',                            $yann_description],
    ['gokmen-tamer-sanli',        'Gökmen Tamer Sanli',       'tu-delft',   'TU Delft',                                    'Claire Chassagne',                       'Coupling mean-field colloidal models and MD to probe surface/water interfaces.'],
    ['yucong-chen',               'Yucong Chen',              'mpg-mainz',  'Max Planck Institute for Polymer Research',   'Mischa Bonn',                            'Characterizing and controlling water structure and dynamics in confinement.'],
    ['sabiar-rahaman',            'Sabiar Rahaman',           'manchester', 'University of Manchester',                    'Radha Boya',                             'Confined water and ions in angstrom-scale capillaries.'],
    ['lauriane-pierrot-deseilligny', 'Lauriane Pierrot-Deseilligny', 'oxford', 'University of Oxford',                    'Susan Perkin',                           $lauriane_description],
    ['shu-yang',                  'Shu Yang',                 'cambridge',  'University of Cambridge',                     'Angelos Michaelides',                    'Accurate quantum simulations of nanoconfined salty water.'],
    ['hamza-el-assri',            'Hamza El Assri',           'sweetch',    'Sweetch Energy & University of Montpellier',  'Mikhael Bechelany & Lydéric Bocquet',    'Experimental and modelling investigation of a nanofluidic osmotic energy generator.'],
];

$fellow_base = ts('2025-01-01');
$assets_dir = $root . '/assets/fellows';
foreach ($fellows as $i => [$slug, $name, $node_slug, $node_label, $pi, $topic]) {
    // Only attach photo_url when the file actually exists on disk; otherwise
    // leave empty so templates skip the <img> tag instead of rendering a 404.
    $photo = is_file("{$assets_dir}/{$slug}.jpg") ? "/assets/fellows/{$slug}.jpg" : '';
    insert_entry($db, 'fellows', $slug, [
        'title' => $name, 'slug' => $slug,
        'node_slug' => $node_slug, 'node_label' => $node_label,
        'pi_name' => $pi, 'topic' => $topic,
        'photo_url' => $photo,
    ], $fellow_base + $i);
}
echo "Inserted " . count($fellows) . " fellows.\n";

/* -------------------------------------------------------------------------
 * Events — network schools, training weeks and workshops.
 *
 * Listed oldest → newest; publish_at is a monotonic sequence anchored in the
 * past so that (a) future-dated events (2026/2027) are still reachable now and
 * (b) the index (order_by publish_at DESC) shows the newest event first.
 *
 * les-houches-2026 keeps its bespoke full-page template (routed by slug in
 * event.twig); its `body`/gallery are ignored there. Every other event uses
 * _event-default.twig, whose `body` we build from the description plus any
 * gallery images dropped into uploads/galleries/{slug}/.
 * ----------------------------------------------------------------------- */
$events = [
    [
        'slug'      => 'mainz-orientation-2024',
        'title'     => 'FLUXIONIC Initial Orientation Workshop and First Training Week',
        'starts_on' => '2024-12-09', 'ends_on' => '2024-12-13',
        'location'  => 'Max Planck Institute for Polymer Research, Mainz',
        'summary'   => 'The Mainz Training Week and General Assembly marked the first FLUXIONIC event bringing together PIs and DCs. It launched advanced training, Career Development Plans, the long-term Proposal training module, and planning for the network’s future activities.',
        'description' => 'The training week / General Assembly in Mainz was the first FLUXIONIC event where the PIs and DCs were present. We carried out the first advanced training modules and initiated the Career Development Plans through individual interviews of the students by the Steering Committee members. We also launched the Proposal training module that will last throughout the network. We planned the programs for the coming years.',
    ],
    [
        'slug'      => 'delft-midterm-2025',
        'title'     => 'FLUXIONIC Midterm Review Meeting and Training Week',
        'starts_on' => '2025-03-31', 'ends_on' => '2025-04-04',
        'location'  => 'TU Delft',
        'summary'   => 'The Delft Annual Meeting and Training Week combined training, project monitoring, and strategic planning. It supported doctoral fellows through scientific and career-focused sessions, reviewed individual and network progress, and strengthened future collaboration across FLUXIONIC.',
        'description' => 'The FLUXIONIC Annual Meeting and Training Week in Delft brought together training activities, project monitoring, and network-level planning. The training programme included sessions on machine learning, advanced materials, scientific writing, proposal presentations, secondment planning, and a formal Midterm Review Meeting with the REA Project Officer. It was structured to assess the progress of the doctoral fellows and the overall network, while also supporting future collaboration and career development.',
    ],
    [
        'slug'      => 'barcelona-students-midterm-2025',
        'title'     => 'FLUXIONIC Students’ Midterm Meeting',
        'starts_on' => '2025-10-01', 'ends_on' => '2025-10-03',
        'location'  => 'University of Barcelona',
        'summary'   => 'The FLUXIONIC Students’ Midterm Meeting reviewed the progress of the individual research projects within the network, while fostering collaboration and offering participants practical tools for their work.',
        'description' => 'The FLUXIONIC Students’ Midterm Meeting was designed to review the progress of the individual research projects within the network, while also fostering collaboration and offering participants practical tools for their work.',
    ],
    [
        'slug'      => 'paris-tech-days-2026',
        'title'     => 'FLUXIONIC Paris Tech Days',
        'starts_on' => '2026-03-04', 'ends_on' => '2026-03-06',
        'location'  => 'ENS Paris · Hummink · Ilion Water Tech · Aqemia',
        'summary'   => 'The FLUXIONIC Paris Tech Days connected academic research with innovation, entrepreneurship, and societal challenges. Through discussions, training sessions, and visits to Hummink, Ilion Water Tech, and Aqemia, participants explored research transfer, start-up development, and careers beyond academia.',
        'description' => 'The FLUXIONIC Paris Tech Days were designed to expose participants to the links between academic research, innovation, entrepreneurship, and societal challenges. The programme combined scientific discussions on the environmental transition with sessions on intellectual property, spin-off companies, ethics, and scientific conduct. Visits to Hummink, Ilion Water Tech, and Aqemia offered students practical insight into research transfer, start-up development, and career paths beyond academia.',
    ],
    [
        'slug'      => 'trondheim-meeting-2026',
        'title'     => 'FLUXIONIC Trondheim Meeting and Training Week',
        'starts_on' => '2026-05-04', 'ends_on' => '2026-05-08',
        'location'  => 'NTNU Trondheim',
        // Presentations archive behind the password gate (spreadsheet "lectures"
        // column). The URL is never rendered publicly — see PublicController::lectures().
        'lectures_url'      => 'https://www.dropbox.com/scl/fi/bynpgjf7rbh3im7h8vj96/Archive.zip?rlkey=4hdv2w4fmur4g9dhjseqgjmhf&st=4jpvauaw&dl=1',
        'lectures_password' => 'Trondheim2026',
        'summary'   => 'The FLUXIONIC Annual Meeting and Training Week in Trondheim combined advanced scientific training with a comprehensive review of network activities. It included career-development sessions, student presentations, Career Development Plan discussions, future event planning, and exchanges among fellows, supervisors, and partners.',
        'description' => 'The FLUXIONIC Annual Meeting and Training Week in Trondheim was designed to combine advanced scientific training with a broad review of the network’s activities. The programme offered students training on hydrodynamic and electrostatic interactions, career-development sessions, and individual discussions on their Career Development Plans. It also provided space for student research presentations, planning of future FLUXIONIC events, and informal exchanges among fellows, supervisors, and partners.',
    ],
    [
        'slug'         => 'les-houches-2026',
        'title'        => 'Nonequilibrium Physics in Nanoconfinement',
        'starts_on'    => '2026-09-14', 'ends_on' => '2026-09-25',
        'location'     => 'Les Houches, French Alps',
        'summary'      => 'Les Houches – WE Heraeus School. A two-week school covering the fundamental physics of nanoscale transport — experimental, theoretical and computational methods. Part of the CECAM Flagship Program.',
        'cover_url'    => '/assets/images/les-houches-mountains.png',
        'external_url' => 'https://www.cecam.org/workshop-details/les-houches-we-heraeus-school-nonequilibrium-physics-in-nanoconfinement-1473',
        'meta_description' => 'Les Houches – WE Heraeus School on Nonequilibrium Physics in Nanoconfinement, September 14–25, 2026.',
    ],
    [
        'slug'         => 'fluctuations-charged-soft-matter-2026',
        'title'        => 'Fluctuations in charged and soft matter',
        'starts_on'    => '2026-10-05', 'ends_on' => '2026-10-08',
        'location'     => 'Institut Henri Poincaré, Paris',
        'summary'      => 'The workshop focuses on transport of soft and charged matter at small scales, highlighting its relevance to nanomaterials and biology. Participants explore nonequilibrium systems, thermal fluctuations, complex interactions, and modern approaches from statistical mechanics, active matter, and machine learning.',
        'description'  => 'Transport of soft and charged matter at small scales underpins advances in nanomaterials and biology, driven by thermal fluctuations and complex interactions. These systems, often far from equilibrium, are modeled as particle suspensions influenced by external forces or active energy conversion. While average behaviors are well-documented, fluctuations — like Casimir interactions or tracer dynamics — are key to understanding transport and kinetics. Tackling these challenges demands tools from statistical mechanics, active matter research, and machine learning.',
        'external_url' => 'https://www.cecam.org/workshop-details/fluctuations-in-charged-and-soft-matter-1526',
    ],
    [
        'slug'         => 'challenges-ionic-fluids-2027',
        'title'        => 'Challenges in ionic fluids: Theory, simulation, and experiment',
        'starts_on'    => '2027-03-22', 'ends_on' => '2027-03-25',
        'location'     => 'CECAM-HQ-EPFL, Lausanne',
        'summary'      => 'The workshop brings together experts to address the complex behavior of ionic fluids across scales. It focuses on emerging theoretical, computational, and experimental approaches, fostering collaboration around more accurate models for concentrated and nonequilibrium ionic systems.',
        'description'  => 'Ionic fluids are vital in science but remain poorly understood due to their complex, multiscale interactions. Traditional theories and simulations struggle with accuracy, especially at high concentrations or in nonequilibrium states. Recent advances in machine learning, density functional theory, and experiments offer new, more precise modeling approaches. These breakthroughs could finally bridge gaps in our understanding. The workshop will gather experts to tackle these challenges collaboratively.',
        'external_url' => 'https://www.cecam.org/workshop-details/challenges-in-ionic-fluids-theory-simulation-and-experiment-1483',
    ],
];

$event_base = ts('2020-01-01');
foreach ($events as $i => $ev) {
    $data = $ev;
    unset($data['description']);
    // Build the default-template body from the prose description plus any
    // gallery images in uploads/galleries/{slug}/ (les-houches ignores body).
    $gallery = gallery_markdown($root, $ev['slug']);
    $body = trim($ev['description'] ?? '');
    if ($gallery !== '') {
        $body = ($body !== '' ? $body . "\n\n" : '') . "## Photos\n\n" . $gallery;
    }
    if ($body !== '') {
        $data['body'] = $body;
    }
    insert_entry($db, 'events', $ev['slug'], $data, $event_base + $i);
}
echo "Inserted " . count($events) . " events.\n";

/* -------------------------------------------------------------------------
 * Conferences | Workshops
 * ----------------------------------------------------------------------- */
$conferences = [
    ['euromxene26-2026',                     'EuroMXene26 Conference',                                                                       '2026-06-03', '2026-06-05', 'Dublin, Ireland',                                          'Insights into the behavior of the MXenes functional groups in working conditions from ab-initio level calculations', '',                                                                  'Valentino Sanguinetti',                                     ''],
    ['faraday-discussion-angstrom-2026',     'Molecular and ion flows through angstrom-scale channels — Faraday Discussion 2026',            '2026-04-13', '2026-04-15', 'Manchester, UK',                                          '',                                                                                  'Ion-gating through two-dimensional Ångström-scale confined channels', 'Sabiar Rahaman, Radha Boya, Valentino Sanguinetti, Ignacio Pagonabarraga', 'Best poster prize'],
    ['molsim-2026',                          'MolSim-2026',                                                                                  '2026-01-05', '2026-01-16', 'University of Amsterdam',                                  '',                                                                                  'Controlling Charging dynamics of Electrolytic Capacitors',          'Megh Dutta, Mattia Borriello, Daan Frenkel',                ''],
    ['stuttgart-espresso-2025',              'Systematic coarse-graining and machine learning in soft matter physics with ESPResSo',         '2025-10-06', '2025-10-10', 'University of Stuttgart',                                  '',                                                                                  'Controlling Charging dynamics of Electrolytic Capacitors',          'Megh Dutta, Gabriele Dalla Valle',                          ''],
    ['manchester-pgr-2025',                  'The Department of Physics & Astronomy 2025 Postgraduate Research Conference',                  '2025-09-26', '2025-09-26', 'University of Manchester, UK',                             '',                                                                                  'Hexaazatriphenylene–Diaminobenzidine Covalent Organic Framework',   'Sabiar Rahaman, Radha Boya',                                'Best poster prize (First place)'],
    ['n-aqua-aussois-2025',                  'N-AQUA meeting (September 2025, Aussois)',                                                     '2025-09-15', '2025-09-19', 'Aussois, France',                                          '',                                                                                  '',                                                                  'Valentino Sanguinetti, Yucong Chen, Marie-Laure Bocquet, Lydéric Bocquet', ''],
    ['ecoss-38-2025',                        '38th European Conference of Surface Science (ECOSS-38)',                                       '2025-08-24', '2025-08-29', 'Braga, Portugal',                                          'Water under h-BN nanoconfinement: structural and chemical insights from ab initio simulations', '',                                                                  'Valentino Sanguinetti',                                     ''],
    ['cecam-electrochemical-2025',           'Simulations of Electrochemical Storage Devices: From Quantum to Classical Descriptions',       '2025-07-21', '2025-07-24', 'CECAM-FR-MOSER, Sorbonne Université, Paris',               '',                                                                                  '',                                                                  'Paula Sierra i Varela, Sara Bonella, Benjamin Rotenberg, Marialore Sulpizi', ''],
    ['ed388-doctoral-day-2025',              'ED 388 Doctoral Students\' Day',                                                               '2025-06-24', '2025-06-24', 'Sorbonne Université, Paris',                               '',                                                                                  '',                                                                  'Megh Dutta',                                                ''],
    ['ufr-young-researchers-2025',           'UFR Young Researchers\' Day',                                                                  '2025-05-27', '2025-05-27', 'Sorbonne Université, Paris',                               'Shortcutting the charging time of an Electrolytic capacitor',                       '',                                                                  'Megh Dutta',                                                ''],
    ['ums-beijing-2025',                     'Understanding Molecular Simulation (Beijing)',                                                 '2025-04-25', '2025-05-05', 'CECAM-CN IoP CAS, Beijing',                                '',                                                                                  '',                                                                  'Yann Dumay, Valentino Sanguinetti, Alessandro Forina, Haoyuan Quan, Ignacio Pagonabarraga, Daan Frenkel, Jure Dobnikar', ''],
    ['barcelona-noneq-school-2025',          'Non-equilibrium statistical physics School',                                                   '2025-04-07', '2025-04-11', 'Universitat de Barcelona',                                 '',                                                                                  '',                                                                  'Gabriele Dalla Valle, Daniel La Valle, Ignacio Pagonabarraga', ''],
    ['journees-physique-statistique-2025',   'Journées de Physique Statistique',                                                             '2025-01-30', '2025-01-31', 'Université Paris Cité, Paris',                             '',                                                                                  '',                                                                  'Megh Dutta, Lydéric Bocquet',                               ''],
    ['n-aqua-ringberg-2025',                 'N-AQUA meeting (January 2025, Ringberg)',                                                      '2025-01-13', '2025-01-17', 'Ringberg, Germany',                                        '',                                                                                  '',                                                                  'Valentino Sanguinetti, Yucong Chen, Marie-Laure Bocquet, Lydéric Bocquet', ''],
    ['ums-amsterdam-2025',                   'Understanding Molecular Simulation (Amsterdam)',                                               '2025-01-06', '2025-01-17', 'Universiteit van Amsterdam',                               '',                                                                                  '',                                                                  'Gabriele Dalla Valle, Yucong Chen, Paula Sierra i Varela',  ''],
    ['thematic-day-nanomaterials-2024',      'Thematic Day: Nanomaterials',                                                                  '2024-11-29', '2024-11-29', 'Sorbonne Université, Paris',                               '',                                                                                  '',                                                                  'Megh Dutta',                                                ''],
];

foreach ($conferences as [$slug, $title, $start, $end, $loc, $talk, $poster, $attendees, $awards]) {
    insert_entry($db, 'conferences', $slug, [
        'title' => $title, 'slug' => $slug,
        'starts_on' => $start, 'ends_on' => $end,
        'location' => $loc,
        'talk_given' => $talk, 'poster' => $poster,
        'attendees' => $attendees, 'awards' => $awards,
        'photos' => gallery_markdown($root, $slug),
    ], ts($start));
}
echo "Inserted " . count($conferences) . " conferences.\n";

/* -------------------------------------------------------------------------
 * Volunteering | Outreach
 * ----------------------------------------------------------------------- */
$outreach = [
    ['talk-mohali-2025',       'Talk: Charging Dynamics of Electric Double-Layer Nanocapacitors in Mean Field', 'Megh Dutta', 'Mohali',     '2025-12-05', 'Scientific presentation and engaging with the students to describe future career opportunities in science and research.'],
    ['ntnu-researchers-night-2025', 'Researcher\'s Night NTNU Trondheim',                                       'Yann Dumay', 'Trondheim',  '2025-09-26', "The Research's Night at NTNU is a huge event were 1100 high school students from the area around Trondheim are visiting the University. The fellow prepared a stand to show live experiments that illustrate the work done in the Eiser group, as well as some videos and a poster."],
    ['ipho-paris-2025',        'International Physics Olympiad 2025',                                           'Megh Dutta', 'Paris',      '2025-07-17', 'Team guide: mentoring and helping students with their schedule planning during the competition.'],
    ['ntnu-school-visit-2025', 'School visit NTNU\'s Lab',                                                       'Yann Dumay', 'Trondheim',  '2025-03-28', 'Giving a presentation to students on polymers and their applications in research and the nature. This included live hands-on experiments, quizzes and interactions with the school students.'],
];

foreach ($outreach as [$slug, $title, $fellow, $loc, $date, $role]) {
    insert_entry($db, 'outreach', $slug, [
        'title' => $title, 'slug' => $slug,
        'date_on' => $date, 'location' => $loc, 'fellow_name' => $fellow,
        'role' => $role,
        'summary' => mb_substr($role, 0, 160) . (mb_strlen($role) > 160 ? '…' : ''),
        'photos' => gallery_markdown($root, $slug),
    ], ts($date));
}
echo "Inserted " . count($outreach) . " outreach entries.\n";

/* -------------------------------------------------------------------------
 * News + Publications (combined, kind=news/publication)
 * ----------------------------------------------------------------------- */
$publications = [
    [
        'slug' => 'visible-light-air-water-interface-pnas-2026',
        'title' => 'Visible light leaves evaporation and interfacial structure of neat water unchanged at the air–water interface',
        'authors' => 'Yucong Chen, Joseph C. Shirley, Zi Xuan Ng, Yongkang Wang, Yuki Nagata, Arsh S. Hazrah, Mischa Bonn',
        'bold_names' => 'Yucong Chen;Mischa Bonn',
        'journal' => 'Proceedings of the National Academy of Sciences',
        'year' => 2026,
        'date' => '2026-09-14',
        'url' => 'https://doi.org/10.1073/pnas.2615377123',
        'abstract' => 'Visible light-induced “photomolecular” enhancement of water evaporation has been proposed as a fundamentally new mode of light–matter interaction at aqueous interfaces, with far-reaching implications for climate processes and light-driven water technologies. Yet, the response of neat interfacial water to visible photons has not been directly quantified at both macroscopic and molecular scales. Here, we combine high-precision confocal displacement measurements with a surface-specific vibrational probe that detects the OH-stretch vibrations of interfacial water molecules with subnanometer depth sensitivity, allowing us to resolve even subtle blue shifts of the hydrogen-bonded continuum and changes in the amplitude and position of the free-OH peak that report on interfacial hydrogen-bond strength and molecular orientation. This approach enables us to track both evaporation kinetics and molecular structure at the air–water boundary. Continuous 450, 532, and 635 nm illumination leaves the macroscopic evaporation rate unchanged over a wide range of humidities, while the interfacial vibrational spectra show no detectable modification of water hydrogen-bonding or molecular orientation under identical environmental conditions. To directly test a nonthermal, field-driven mechanism, we further exposed the interface to femtosecond visible and near-infrared pulses spanning 515, 800, and 1030 nm; the peak intensities were increased by more than ten orders of magnitude, and no structural change was observed. Together, these measurements show that the neat air–water interface is remarkably insensitive to visible irradiation, implying that any substantial light-enhanced evaporation is most consistent with photothermal or geometric effects in complex materials rather than from a new, nonthermal and nonresonant pathway intrinsic to liquid water.',
    ],
    [
        'slug' => 'accelerating-charging-dynamics-edlc-2026',
        'title' => 'Accelerating charging dynamics of electric double-layer capacitors',
        'authors' => 'Megh Dutta, Ivan Palaia, Emmanuel Trizac, Benjamin Rotenberg',
        'bold_names' => 'Megh Dutta;Emmanuel Trizac;Benjamin Rotenberg',
        'journal' => 'Journal of Chemical Physics',
        'year' => 2026,
        'date' => '2026-08-13',
        'url' => 'https://pubs.aip.org/aip/jcp/article/165/6/064116/3401068/Accelerating-charging-dynamics-of-electric-double',
        'abstract' => 'Electric double-layer capacitors (EDLCs), consisting of an ionic fluid between two metallic electrodes, are electrochemical energy storage devices complementary to batteries, allowing for a faster charge/discharge. The charging dynamics in response to a voltage step features a variety of regimes and relaxation timescales, depending on the applied voltage and the various lengths characterizing the system, most importantly the inter-electrode distance and the Debye length over which electrostatic effects are screened in the electrolyte. Inspired by recent works on “shortcut to adiabaticity” in colloidal systems, here we investigate the possibility to control the charge and discharge of planar EDLCs using time-dependent voltages. In particular, our aim is to achieve a full charge or discharge within a finite time shorter than their intrinsic relaxation timescales. Within the Poisson–Nernst–Planck model and the small-voltage regime, we derive time-dependent protocols that can eliminate an arbitrary number of relaxation modes. This permits to approach the equilibrium charged state within a finite time, which can be in practice an order of magnitude faster than the natural equilibration time. We illustrate the relevance and efficacy of the method on polynomial drivings and show that the surface charge density, charge-density profiles, and global deviation from equilibrium (quantified by a Kullback–Leibler-like divergence) can all be significantly accelerated, even for driving times comparable to or shorter than the natural RC time of the system.',
    ],
    [
        'slug' => 'charge-localization-patchy-nanochannels-2026',
        'title' => 'Charge localization, rectification, and transport in electrolyte patchy nanochannels',
        'authors' => 'Sergi G. Leyva, Gabriele Dalla Valle, Tine Curk, Ignacio Pagonabarraga',
        'bold_names' => 'Gabriele Dalla Valle;Ignacio Pagonabarraga',
        'journal' => 'Faraday Discussions',
        'year' => 2026,
        'date' => '2026-07-07',
        'url' => 'https://doi.org/10.1039/d6fd00007j',
        'abstract' => 'We study ionic charge localization and transport in electrolyte-filled nanochannels with heterogeneous walls. Localized charged patches at the channel boundaries trap counterions, enabling controlled charge accumulation in otherwise straight channels. Combining lattice-Boltzmann simulations with analytical modeling, we show that the stability and mobility of these charge clouds result from a balance between electrostatic forces, hydrodynamic drag, and diffusion. Under applied electric fields and pressure gradients, localized charge produces diode-like rectification. Pressure-driven flow shifts the dissociation threshold of the counterion cloud, yielding strongly asymmetric current–voltage characteristics. A minimal force-balance model quantitatively captures the rectification window and its linear dependence on the pressure gradient, demonstrating rectification in the absence of geometric asymmetry. We further examine dynamic control using moving wall patches. In the linear electrostatic regime, charge responds diffusively to patch motion, while strong wall potentials induce a strong colocalization and active charge transport. We identify drift- and diffusion-dominated transport regimes and a critical patch velocity beyond which charge localization fails. These results establish patchy wall potentials as a minimal mechanism for controlling ionic localization, rectification, and transport in nanochannels.',
    ],
    [
        'slug' => 'cosurfactant-induced-disorder-polymersome-2026',
        'title' => 'Cosurfactant-Induced Disorder in Polymersome Membrane Enhances Diffusion of Cargo Molecules',
        'authors' => 'Gabrielle A. Ong, Priyanka Sharan, Robert Graf, Kaloian Koynov, Yucong Chen, Arsh S. Hazrah, Katharina Landfester',
        'bold_names' => 'Yucong Chen;Arsh S. Hazrah',
        'journal' => 'ACS Nano',
        'year' => 2026,
        'date' => '2026-04-29',
        'url' => 'https://doi.org/10.1021/acsnano.6c00963',
        'abstract' => 'Giant polymersomes are widely used as artificial cells due to their resemblance to natural cells; however, their intrinsically low membrane permeability remains a major limitation for applications such as drug delivery and bioreactors. Here, we report a microfluidic approach to fabricate permeable polymersomes using PB-b-PEO as a macromolecular surfactant and oleyl alcohol as a cosurfactant. Incorporation of the cosurfactant into the membrane induces membrane structural disorder in polymer packing, leading to enhanced membrane permeability. Using advanced nuclear magnetic resonance (NMR) spectroscopy, we directly probe the heterogeneity within polymersome membranes, representing membrane-level investigation in giant polymersomes. Comparison with polymersomes exhibiting tightly packed polymer assemblies reveals pronounced differences in the lateral mobility and permeability of the membrane. Our results demonstrate how subtle changes in formulation translate into distinct membrane structures, establishing a molecular basis for the rational design of polymersomes with tailored permeability.',
    ],
    [
        'slug' => 'edl-nanocapacitor-charging-prl-2025',
        'title' => 'Charging Dynamics of Electric Double-Layer Nanocapacitors in Mean Field',
        'authors' => 'Ivan Palaia, Adelchi J. Asta, Megh Dutta, Patrick B. Warren, Benjamin Rotenberg, Emmanuel Trizac',
        'bold_names' => 'Megh Dutta;Benjamin Rotenberg;Emmanuel Trizac',
        'journal' => 'Physical Review Letters',
        'year' => 2025,
        'date' => '2025-09-29',
        'url' => 'https://journals.aps.org/prl/abstract/10.1103/72b9-c8cq',
        'abstract' => 'An electric double-layer capacitor (EDLC) stores energy by modulating the spatial distribution of ions in the electrolytic solution that it contains. We determine the mean-field timescales for planar EDLC relaxation to equilibrium after a potential difference is applied. We tackle first the fully symmetric case, where positive and negative ionic species have the same valence and diffusivity, and then the general, more complex, asymmetric case. Depending on the applied voltage and salt concentration, different regimes appear, revealing a remarkably rich phenomenology relevant for nanocapacitors.',
    ],
    [
        'slug' => 'pnp-charging-dynamics-pre-2025',
        'title' => 'Poisson–Nernst–Planck charging dynamics of an electric double-layer capacitor: Symmetric and asymmetric binary electrolytes',
        'authors' => 'Ivan Palaia, Adelchi J. Asta, Megh Dutta, Patrick B. Warren, Benjamin Rotenberg, Emmanuel Trizac',
        'bold_names' => 'Megh Dutta;Benjamin Rotenberg;Emmanuel Trizac',
        'journal' => 'Physical Review E',
        'year' => 2025,
        'date' => '2025-09-29',
        'url' => 'https://journals.aps.org/pre/abstract/10.1103/p4dg-snqf',
        'abstract' => 'A parallel plate capacitor containing an electrolytic solution is the simplest model of a supercapacitor or electric double-layer capacitor. Using both analytical and numerical techniques, we solve the Poisson-Nernst-Planck equations for such a system, describing the mean-field charging dynamics of the capacitor, when a constant potential difference is abruptly applied to its plates. Working at constant total number of ions, we focus on the physical processes involved in the relaxation and, whenever possible, give its functional shape and exact time constants. We first review and study the case of a symmetric binary electrolyte, where we assume the two ionic species to have the same charges and diffusivities. We then relax these assumptions and present results for a generic strong (i.e., fully dissociated) binary electrolyte. At low electrolyte concentration, the relaxation is simple to understand, as the dynamics of positive and negative ions appear decoupled. At higher electrolyte concentration, we distinguish several regimes. In the linear regime (low voltages), relaxation is multiexponential, it starts by the buildup of the equilibrium charge profile and continues with neutral mass diffusion, and the relevant timescales feature both the average and the Nernst-Hartley diffusion coefficients. In the purely nonlinear regime (intermediate voltages), the initial relaxation is slowed down exponentially due to increased capacitance, while bulk effects become more and more evident. In the fully nonlinear regime (high voltages), the dynamics of charge and mass are completely entangled and, asymptotically, the relaxation is linear in time. We finally discuss nonideal behavior in real capacitors and provide conditions for which mean-field is expected to hold.',
    ],
    [
        'slug' => 'hat-dab-cof-chem-mater-2025',
        'title' => 'Hexaazatriphenylene–Diaminobenzidine Covalent Organic Framework: A Promising Nitrogen Abundant Material for Electrochemical Energy Storage Applications',
        'authors' => 'Korak Kar†, Sabiar Rahaman†, Yuchen Liu, Krishna D Bhalerao, Hiran Jyothilal, Benjamin B Duff, Dinachandra Singh Mayanglambam, Basker Sundararaju, Boya Radha, Kumar Biradha, Ashok Keerthi',
        'bold_names' => 'Sabiar Rahaman;Boya Radha',
        'journal' => 'Chemistry of Materials',
        'year' => 2025,
        'date' => '2025-08-26',
        'url' => 'https://doi.org/10.1021/acs.chemmater.5c01220',
        'abstract' => 'Covalent organic frameworks (COFs) are emerging as promising electrode materials due to their high surface area, tunable porosity, and design flexibility. However, their practical use in energy storage remains limited by their poor stability and electrochemical performance. Here, we report a nitrogen-rich COF, synthesized via an irreversible aromatic nucleophilic substitution between hexaazatriphenylenehexacarbonitrile and 3,3′-diaminobenzidine (HAT-DAB COF), forming stable –C═N– and –C–N– linkages. The framework integrates redox-active phenazine and arylamine units, offering a porous, crystalline, and nitrogen-rich architecture. Structural and morphological analyses confirm its robust and porous nature. As a bifunctional electrode, HAT-DAB COF shows excellent performance in lithium-ion batteries, with a specific capacity of 265 mAh/g, an energy density of ∼607 Wh/kg, and ∼98% Coulombic efficiency over hundreds of cycles. As a supercapacitor, it delivers 110.5 mF/cm² at 1 mV/s, with ∼95% capacitance retention and 100% Coulombic efficiency over 8000 cycles. Capacitance arises from a synergy of electric double-layer and redox (Faradaic) processes, with the diffusive component retained even at high scan rates, indicating strong pseudocapacitor behavior. This work demonstrates the value of irreversible linkages and rational redox-active design in achieving durable, high-performance COFs for next-generation energy storage applications.',
    ],
    [
        'slug' => 'on-water-2d-cmof-films-adv-mater-2026',
        'title' => 'On-Water Surface Synthesis of 2D Conjugated Metal–Organic Framework Films With Controllable Layer Orientation Enabling High-Performance Chemiresistive Sensing',
        'authors' => 'Jianjun Zhang, Víctor García-López, Yutong Wu, Shuai Fu, Yucong Chen, Arsh S. Hazrah, Petko Petkov, Mike Hambsch, Feng Ni, Alina Müller, Ye Yang, Leif Riemenschneider, Shirong Huang, Albertus Mattheüs Sandee, Yilv Guo, David Silva-Brea, Jan-Ole Joswig, Stefan C. B. Mannsfeld, Thomas Heine, Gianaurelio Cuniberti, Mischa Bonn, Zhiyong Wang, Xinliang Feng',
        'bold_names' => 'Yucong Chen;Arsh S. Hazrah;Mischa Bonn',
        'journal' => 'Advanced Materials',
        'year' => 2026,
        'date' => '2026-06-23',
        'url' => 'https://doi.org/10.1002/adma.73785',
        'abstract' => 'Two-dimensional conjugated metal–organic frameworks (2D c-MOFs) offer an appealing platform for electronic devices, particularly chemiresistive sensors, owing to their unique combination of electrical conductivity and intrinsic porosity. However, their pronounced structural and transport anisotropies render device performance highly sensitive to layer orientation, underscoring the need for synthetic strategies that enable the controlled synthesis of well-aligned 2D c-MOF films. Here, we introduce a surfactant monolayer-assisted on-water synthesis that programs the layer orientation of conductive Ni-HHTP (HHTP = 2,3,6,7,10,11-hexahydroxytriphenylene) films (face-on vs. edge-on) over cm²-scale areas by tuning ligand-surfactant monolayer electrostatic vs. hydrogen-bonding interactions. Imaging and scattering techniques unambiguously confirm preferential face-on and edge-on layer orientations, while electrical transport and optical pump-THz probe spectroscopy reveal markedly enhanced intralayer charge transport in face-on films, motivating their integration into chemiresistive sensing. Chemiresistive NH₃ sensors based on face-on Ni-HHTP films achieve a response of 269.8% at 50 ppm and an ultralow detection limit of 8.45 ppb at room temperature, surpassing edge-on films and previously reported 2D c-MOF sensors. These results establish surfactant-programmed on-water synthesis as a new route to macroscopic orientation control in 2D c-MOFs, enabling deliberate exploitation of their anisotropic charge transport in high-performance sensing and electronic devices.',
    ],
    [
        'slug' => 'nanofluidic-ionic-memory-nat-rev-mater-2026',
        'title' => 'Nanofluidic ionic memory for next-generation computing',
        'authors' => 'Siddhi Vinayak Pandey, Kalluvadi Veetil Saurav, Abdulghani Ismail, Sabiar Rahaman, Boya Radha',
        'bold_names' => 'Sabiar Rahaman;Boya Radha',
        'journal' => 'Nature Reviews Materials',
        'year' => 2026,
        'date' => '2026-06-03',
        'url' => 'https://doi.org/10.1038/s41578-026-00919-1',
        'abstract' => 'The biological brain stores and processes information with exceptional energy efficiency, motivating the search for alternatives to traditional von Neumann computing systems that separate memory from processing. Nanofluidic memristors have emerged as promising building blocks for non-conventional neuromorphic computing, in which ion transport under nanoscale confinement generates history-dependent conductance for analog or digital switching. Their performance is governed by surface chemistry, device geometry and electrolyte properties, which together give rise to diverse memristive mechanisms and hysteresis loop types. Exploring new materials not only improves functionality but also deepens our understanding of the diverse physical mechanisms driving memristive behaviour. Despite rapid progress, challenges remain in mechanisms identification, fabrication scalability, variability control, fine tuning of memristive properties, and integration into higher-order neuromorphic architectures. This Perspective summarizes recent advances in materials and mechanisms, outlines characterization protocols and highlights emerging applications from in-sensor computing to visual processing and reservoir computing, while discussing how tailored nanochannel materials may enable next-generation, brain-inspired iontronic neuromorphic systems.',
    ],
    [
        'slug' => 'hat-quinone-cop-supercapacitors-jacs-2026',
        'title' => 'Hexaazatriphenylene–Quinone Covalent Organic Polymers as a Platform for Stable and High-Performance Supercapacitors',
        'authors' => 'Yuchen Liu†, Sabiar Rahaman†, Hiran Jyothilal, Tirumala Rao Dumpala, Korak Kar, Benjamin Duff, Hadeel Abbas, Alessandro Grillo, Alice Bowen, Ashok Keerthi',
        'bold_names' => 'Sabiar Rahaman',
        'journal' => 'Journal of the American Chemical Society',
        'year' => 2026,
        'date' => '2026-06-03',
        'url' => 'https://doi.org/10.1021/jacs.5c20557',
        'abstract' => 'Developing high-performance supercapacitors requires an optimal balance of capacitance, energy, and power density together with long-term cycling stability. Here, we report a family of heteroatom-doped, spin-active, and redox-active hexaazatriphenylene–quinone covalent organic polymers (COPs) prepared through complementary mechanochemical and solution-phase syntheses. These materials exhibit chemical robustness under acidic conditions and strong pseudocapacitive activity arising from delocalized spin centers and quinone redox sites. Among them, COP-2 displays the most favorable electrochemical characteristics, achieving an areal capacitance of up to 6214 mF/cm² (863 F/g) and an unprecedented energy density of 1.91 mWh/cm² (266 Wh/kg) at 1 mA/cm² in symmetric two-electrode devices. The material also demonstrates high-rate capability with a maximum power density of 51.4 mW/cm² (7139 W/kg) and stable cycling performance, retaining 82.1% capacitance after 50,000 cycles. Mechanistic studies combining spectroscopy, electrochemical analysis, and electronic structure simulations highlight the interplay of redox activity and spin delocalization in governing charge storage. These results establish a molecular-to-device design framework for developing spin-active porous polymers as advanced energy storage materials.',
    ],
    [
        'slug' => '2d-mof-supercapacitors-nano-lett-2026',
        'title' => 'Two-Dimensional Metal–Organic Framework for Supercapacitors: Thickness-Dependent Charge Storage Mechanisms',
        'authors' => 'Hiran Jyothilal, Sabiar Rahaman, Vikas Sharma, Kavita Pandey, Ashok Keerthi, Boya Radha',
        'bold_names' => 'Sabiar Rahaman;Boya Radha',
        'journal' => 'Nano Letters',
        'year' => 2026,
        'date' => '2026-01-31',
        'url' => 'https://doi.org/10.1021/acs.nanolett.5c06178',
        'abstract' => 'Additive-free active materials are desirable for energy storage devices as they reduce processing complexity and eliminate variability from binders or conductive additives. We report the synthesis of a highly stable, two-dimensional copper-based metal–organic framework (CuMOF) film with a tunable thickness. The exceptional adhesion of CuMOF films to electrode surfaces enables a binder-free fabrication approach, addressing a key challenge in energy storage applications, particularly in electrode design. The film exhibits a columnar morphology with well-defined grain boundaries and a high surface area, making it optimal for supercapacitor applications. Electrochemical characterization on glassy carbon electrodes yielded an areal capacitance of 2.9 mF/cm² at a scan rate of 1 mV/s using a ∼160 nm thick CuMOF film. We investigated films as thin as 2.4 nm, where the capacitance is predominantly governed by electrical double-layer effects, highlighting the interplay between the film structure and electrochemical behavior. Thus, CuMOF films offer practical applicability, advancing efficient binder-free energy storage.',
    ],
];

foreach ($publications as $p) {
    insert_entry($db, 'news', $p['slug'], [
        'title' => $p['title'],
        'slug' => $p['slug'],
        'kind' => 'publication',
        'authors' => $p['authors'],
        'bold_names' => $p['bold_names'],
        'journal' => $p['journal'],
        'year' => $p['year'],
        'publication_url' => $p['url'],
        'abstract' => $p['abstract'],
    ], ts($p['date']));
}
echo "Inserted " . count($publications) . " publications.\n";

echo "\nDone. Run /install in a browser to set up an admin account.\n";
