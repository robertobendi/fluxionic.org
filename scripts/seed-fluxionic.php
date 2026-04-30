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

function insert_entry(Database $db, string $collection, string $slug, array $data, int $publishAt): void
{
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
            'student_1_topic' => 'Two-phase flow in confined geometries — coupled hydrodynamic and ionic transport of two-phase fluid dispersions in 3D-printed porous media, with an emphasis on electrical signals from droplets passing through pore-scale "necks" and on the coupling of heat transport and ionic currents.',
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

            'student_1_name' => 'Lauriane Pierot Deseilligny',
            'student_1_supervisor' => 'Susan Perkin',
            'student_1_topic' => 'Confinement-induced phase transition in liquid binary mixtures — surface-force-balance, calorimetric and electrochemical study of three-component electrolytes (salt, neutral solvent, zwitterionic osmolyte) under nanoscale confinement.',
            'student_1_photo_url' => '/assets/fellows/lauriane-pierot-deseilligny.jpg',
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
    ['yann-dumay',                'Yann Dumay',               'ntnu',       'NTNU — PoreLab',                              'Erika Eiser',                            'Two-phase flow in confined geometries.'],
    ['gokmen-tamer-sanli',        'Gökmen Tamer Sanli',       'tu-delft',   'TU Delft',                                    'Claire Chassagne',                       'Coupling mean-field colloidal models and MD to probe surface/water interfaces.'],
    ['yucong-chen',               'Yucong Chen',              'mpg-mainz',  'Max Planck Institute for Polymer Research',   'Mischa Bonn',                            'Characterizing and controlling water structure and dynamics in confinement.'],
    ['sabiar-rahaman',            'Sabiar Rahaman',           'manchester', 'University of Manchester',                    'Radha Boya',                             'Confined water and ions in angstrom-scale capillaries.'],
    ['lauriane-pierot-deseilligny', 'Lauriane Pierot Deseilligny', 'oxford', 'University of Oxford',                       'Susan Perkin',                           'Confinement-induced phase transition in liquid binary mixtures.'],
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
 * Events — only the routable URL is needed; the Les Houches detail page
 * is rendered by templates/theme/default/event-les-houches.twig.
 * ----------------------------------------------------------------------- */
// publish_at must be in the past so the entry is accessible now;
// the actual event date is in the `starts_on` field used for display.
insert_entry($db, 'events', 'les-houches-2026', [
    'title'        => 'Nonequilibrium Physics in Nanoconfinement',
    'slug'         => 'les-houches-2026',
    'starts_on'    => '2026-09-14',
    'ends_on'      => '2026-09-25',
    'location'     => 'Les Houches, French Alps',
    'summary'      => 'Les Houches – WE Heraeus School. A two-week school covering the fundamental physics of nanoscale transport — experimental, theoretical and computational methods. Part of the CECAM Flagship Program.',
    'cover_url'    => '/assets/images/les-houches-mountains.png',
    'external_url' => 'https://www.cecam.org/workshop-details/les-houches-we-heraeus-school-nonequilibrium-physics-in-nanoconfinement-1473',
    'meta_description' => 'Les Houches – WE Heraeus School on Nonequilibrium Physics in Nanoconfinement, September 14–25, 2026.',
], ts('2025-01-01'));
echo "Inserted 1 event (les-houches-2026).\n";

/* -------------------------------------------------------------------------
 * Conferences | Workshops
 * ----------------------------------------------------------------------- */
$conferences = [
    ['molsim-2026',                          'MolSim-2026',                                                                                  '2026-01-05', '2026-01-16', 'University of Amsterdam',                                  '',                                                                                  'Controlling Charging dynamics of Electrolytic Capacitors',          'Megh Dutta, Mattia Borriello',                              ''],
    ['stuttgart-espresso-2025',              'Systematic coarse-graining and machine learning in soft matter physics with ESPResSo',         '2025-10-06', '2025-10-10', 'University of Stuttgart',                                  '',                                                                                  'Controlling Charging dynamics of Electrolytic Capacitors',          'Megh Dutta, Gabriele Dalla Valle',                          ''],
    ['manchester-pgr-2025',                  'The Department of Physics & Astronomy 2025 Postgraduate Research Conference',                  '2025-09-26', '2025-09-26', 'University of Manchester, UK',                             '',                                                                                  'Hexaazatriphenylene–Diaminobenzidine Covalent Organic Framework',   'Sabiar Rahaman, Radha Boya',                                'Best poster prize (First place)'],
    ['n-aqua-aussois-2025',                  'N-AQUA meeting (September 2025, Aussois)',                                                     '2025-09-15', '2025-09-19', 'Aussois, France',                                          '',                                                                                  '',                                                                  'Valentino Sanguinetti, Yucong Chen, Marie-Laure Bocquet, Lydéric Bocquet', ''],
    ['ecoss-38-2025',                        '38th European Conference of Surface Science (ECOSS-38)',                                       '2025-08-24', '2025-08-29', 'Braga, Portugal',                                          'Water under h-BN nanoconfinement: structural and chemical insights from ab initio simulations', '',                                                                  'Valentino Sanguinetti',                                     ''],
    ['cecam-electrochemical-2025',           'Simulations of Electrochemical Storage Devices: From Quantum to Classical Descriptions',       '2025-07-21', '2025-07-24', 'CECAM-FR-MOSER, Sorbonne Université, Paris',               '',                                                                                  '',                                                                  'Paula Sierra i Varela',                                     ''],
    ['ed388-doctoral-day-2025',              'ED 388 Doctoral Students\' Day',                                                               '2025-06-24', '2025-06-24', 'Sorbonne Université, Paris',                               '',                                                                                  '',                                                                  'Megh Dutta',                                                ''],
    ['ufr-young-researchers-2025',           'UFR Young Researchers\' Day',                                                                  '2025-05-27', '2025-05-27', 'Sorbonne Université, Paris',                               'Shortcutting the charging time of an Electrolytic capacitor',                       '',                                                                  'Megh Dutta',                                                ''],
    ['ums-beijing-2025',                     'Understanding Molecular Simulation (Beijing)',                                                 '2025-04-25', '2025-05-05', 'CECAM-CN IoP CAS, Beijing',                                '',                                                                                  '',                                                                  'Yann Dumay, Valentino Sanguinetti, Alessandro Forina, Haoyuan Quan', ''],
    ['barcelona-noneq-school-2025',          'Non-equilibrium statistical physics School',                                                   '2025-04-07', '2025-04-11', 'Universitat de Barcelona',                                 '',                                                                                  '',                                                                  'Gabriele Dalla Valle, Daniel La Valle',                     ''],
    ['journees-physique-statistique-2025',   'Journées de Physique Statistique',                                                             '2025-01-30', '2025-01-31', 'Université Paris Cité, Paris',                             '',                                                                                  '',                                                                  'Megh Dutta, Lydéric Bocquet',                               ''],
    ['n-aqua-ringberg-2025',                 'N-AQUA meeting (January 2025, Ringberg)',                                                      '2025-01-13', '2025-01-17', 'Ringberg, Germany',                                        '',                                                                                  '',                                                                  'Valentino Sanguinetti, Yucong Chen, Marie-Laure Bocquet, Lydéric Bocquet', ''],
    ['ums-amsterdam-2025',                   'Understanding Molecular Simulation (Amsterdam)',                                               '2025-01-06', '2025-01-17', 'Universiteit van Amsterdam',                               '',                                                                                  '',                                                                  'Gabriele Dalla Valle, Yucong Chen, Paula Sierra i Varela',  ''],
    ['thematic-day-nanomaterials-2024',      'Thematic Day: Nanomaterials',                                                                  '2024-11-29', '2024-11-29', 'Sorbonne Université, Paris',                               '',                                                                                  '',                                                                  'Megh Dutta',                                                ''],
];

$photo_links = [
    'stuttgart-espresso-2025' => 'https://drive.google.com/drive/folders/1yp2jZlE3bywUOWrWLRG1t44SlnLQ0iOM?usp=drive_link',
];

foreach ($conferences as [$slug, $title, $start, $end, $loc, $talk, $poster, $attendees, $awards]) {
    $photos = $photo_links[$slug] ?? '';
    insert_entry($db, 'conferences', $slug, [
        'title' => $title, 'slug' => $slug,
        'starts_on' => $start, 'ends_on' => $end,
        'location' => $loc,
        'talk_given' => $talk, 'poster' => $poster,
        'attendees' => $attendees, 'awards' => $awards,
        'photos' => $photos !== '' ? "[Conference photo album]({$photos})" : '',
    ], ts($start));
}
echo "Inserted " . count($conferences) . " conferences.\n";

/* -------------------------------------------------------------------------
 * Volunteering | Outreach
 * ----------------------------------------------------------------------- */
$outreach = [
    ['talk-mohali-2025',       'Talk: Charging Dynamics of Electric Double-Layer Nanocapacitors in Mean Field', 'Megh Dutta', 'Mohali',     '2025-12-05', 'Scientific presentation and engaging with the students to describe future career opportunities in science and research.', 'https://drive.google.com/drive/folders/1GZIc50g8jR4_7j_Vvmgs_2-Wt4co_JS3?usp=drive_link'],
    ['ntnu-researchers-night-2025', 'Researcher\'s Night NTNU Trondheim',                                       'Yann Dumay', 'Trondheim',  '2025-09-26', "The Research's Night at NTNU is a huge event were 1100 high school students from the area around Trondheim are visiting the University. The fellow prepared a stand to show live experiments that illustrate the work done in the Eiser group, as well as some videos and a poster.", ''],
    ['ipho-paris-2025',        'International Physics Olympiad 2025',                                           'Megh Dutta', 'Paris',      '2025-07-17', 'Team guide: mentoring and helping students with their schedule planning during the competition.',                            'https://drive.google.com/drive/folders/1CXrvSP56lDCfkgA12QLWw_qc4zEo4-Ss?usp=drive_link'],
    ['ntnu-school-visit-2025', 'School visit NTNU\'s Lab',                                                       'Yann Dumay', 'Trondheim',  '2025-03-28', 'Giving a presentation to students on polymers and their applications in research and the nature. This included live hands-on experiments, quizzes and interactions with the school students.',                                            ''],
];

foreach ($outreach as [$slug, $title, $fellow, $loc, $date, $role, $photos]) {
    insert_entry($db, 'outreach', $slug, [
        'title' => $title, 'slug' => $slug,
        'date_on' => $date, 'location' => $loc, 'fellow_name' => $fellow,
        'role' => $role,
        'summary' => mb_substr($role, 0, 160) . (mb_strlen($role) > 160 ? '…' : ''),
        'photos' => $photos !== '' ? "[Photo album]({$photos})" : '',
    ], ts($date));
}
echo "Inserted " . count($outreach) . " outreach entries.\n";

/* -------------------------------------------------------------------------
 * News + Publications (combined, kind=news/publication)
 * ----------------------------------------------------------------------- */
$publications = [
    [
        'slug' => 'cosurfactant-induced-disorder-polymersome-2026',
        'title' => 'Cosurfactant-Induced Disorder in Polymersome Membrane Enhances Diffusion of Cargo Molecules',
        'authors' => 'Gabrielle A. Ong, Priyanka Sharan, Robert Graf, Kaloian Koynov, Yucong Chen, Arsh S. Hazrah, Katharina Landfester',
        'bold_names' => 'Yucong Chen',
        'journal' => 'ACS Nano',
        'year' => 2026,
        'date' => '2026-04-29',
        'url' => 'https://doi.org/10.1021/acsnano.6c00963',
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
    ],
    [
        'slug' => 'pnp-charging-dynamics-pre-2025',
        'title' => 'Poisson–Nernst–Planck charging dynamics of an electric double-layer capacitor: Symmetric and asymmetric binary electrolytes',
        'authors' => 'Ivan Palaia, Adelchi J. Asta, Megh Dutta, Patrick B. Warren, Benjamin Rotenberg, Emmanuel Trizac',
        'bold_names' => 'Megh Dutta;Benjamin Rotenberg;Emmanuel Trizac',
        'journal' => 'Physical Review E',
        'year' => 2025,
        'date' => '2025-09-29',
        'url' => '',
    ],
    [
        'slug' => 'hat-dab-cof-chem-mater-2025',
        'title' => 'Hexaazatriphenylene–Diaminobenzidine Covalent Organic Framework: A Promising Nitrogen Abundant Material for Electrochemical Energy Storage Applications',
        'authors' => 'Korak Kar, Sabiar Rahaman, Yuchen Liu, Krishna D Bhalerao, Hiran Jyothilal, Benjamin B Duff, Dinachandra Singh Mayanglambam, Basker Sundararaju, Boya Radha, Kumar Biradha, Ashok Keerthi',
        'bold_names' => 'Sabiar Rahaman;Boya Radha',
        'journal' => 'Chemistry of Materials',
        'year' => 2025,
        'date' => '2025-08-26',
        'url' => 'https://doi.org/10.1021/acs.chemmater.5c01220',
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
    ], ts($p['date']));
}
echo "Inserted " . count($publications) . " publications.\n";

echo "\nDone. Run /install in a browser to set up an admin account.\n";
