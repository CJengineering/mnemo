export const sidebarData = [
    {
      name: 'Community',
      href: '/community',
      icon: 'GlobeAltIcon'
    },
    {
      name: 'About',
      icon: 'AcademicCapIcon',
      children: [
        { name: 'Overview', href: '/about/overview' },
        { name: 'Team', href: '/about/team' },
        { name: 'Jameel family', href: '/about/family' },
        { name: 'Family album', href: '/about/family-album' },
        { name: 'Brand', href: '/about/brand' }
      ]
    },
    {
      name: 'Programmes',
      icon: 'CpuChipIcon',
      children: [
        {
          name: 'J-PAL',
          children: [
            { name: 'J-PAL Global', href: '/programmes/j-pal' },
            {
              name: 'J-PAL MENA',
              href: 'https://www.povertyactionlab.org/middle-east-and-north-africa',
              targetBlank: true
            },
            {
              name: 'ESII',
              href: 'https://www.povertyactionlab.org/initiative/european-social-inclusion-initiative',
              targetBlank: true
            },
            {
              name: 'HAPIE',
              href: 'https://www.povertyactionlab.org/page/hub-advanced-policy-innovation-environment-hapie',
              targetBlank: true
            },
            {
              name: 'J-PAL Air and Water Labs',
              href: 'https://www.povertyactionlab.org/page/air-and-water-labs',
              targetBlank: true
            },
            {
              name: 'Gender norms in India',
              href: '/programmes/j-pal/reshaping-gender-norms-in-india'
            }
          ]
        },
        {
          name: 'MIT J-WAFS',
          children: [
            { name: 'Overview', href: '/programmes/j-wafs' },
            {
              name: 'FACT Alliance',
              href: 'https://jwafs.mit.edu/alliance',
              targetBlank: true
            },
            {
              name: 'Jameel Index',
              href: 'https://jameelindex.mit.edu',
              targetBlank: true
            }
          ]
        },
        { name: 'MIT J-WEL', href: '/programmes/j-wel' },
        { name: 'MIT Jameel Clinic', href: '/programmes/jameel-clinic' },
        {
          name: 'Jameel Institute',
          children: [
            {
              name: 'Overview',
              href: '/programmes/jameel-institute'
            },
            {
              name: 'Jameel Institute Kenneth C. Griffin Intitiative',
              href: '/programmes/jameel-institute/kenneth-c-griffin-initiative-for-economics-of-pandemic-preparedness'
            }
          ]
        },
        {
          name: 'Jameel Observatory',
          children: [
            { name: 'Overview', href: '/programmes/jameel-observatory' },
            {
              name: 'Food Security Early Action',
              href: '/programmes/jameel-observatory/for-food-security-early-action'
            },
            {
              name: 'CREWSnet',
              href: '/programmes/jameel-observatory/crewsnet'
            }
          ]
        },
        {
          name: 'Jameel Arts & Health Lab',
          children: [
            { name: 'Overview', href: '/programmes/jameel-arts-and-health-lab' },
            {
              name: 'Healing Arts Scotland',
              href: '/programmes/jameel-arts-and-health-lab/healing-arts/scotland'
            }
          ]
        },
        {
          name: 'CLIMAVORE x Jameel at RCA',
          href: '/programmes/climavore-x-jameel-at-rca'
        },
        {
          name: 'Bocelli-Jameel Scholarship',
          children: [
            {
              name: 'Overview',
              href: '/programmes/bocelli-jameel-scholarship'
            },
            {
              name: 'Scholars',
              children: [
                {
                  name: 'Clara Barbier Serrano (2020)',
                  href: '/people/clara-barbier-serrano'
                },
                {
                  name: 'Laura Mekhail (2021)',
                  href: '/people/laura-mekhail'
                },
                {
                  name: 'Seonwoo Lee (2022)',
                  href: '/people/seonwoo-lee'
                },
                {
                  name: 'Anastasia Koorn (2023)',
                  href: '/people/anastasia-koorn'
                },
                {
                  name: 'Henna Mun (2023)',
                  href: '/people/henna-mun'
                }
              ]
            },
            {
              name: 'Media',
              href: '/programmes/bocelli-jameel-scholarship/media'
            }
          ]
        },
        {
          name: 'Jameel House of Traditional Arts in Cairo',
          children: [
            {
              name: 'Overview',
              href: '/programmes/jameel-house-of-traditional-arts-in-cairo'
            },
            {
              name: 'Graduation collections',
              children: [
                {
                  name: '2023',
                  href: '/programmes/jameel-house-of-traditional-arts-in-cairo/2023-graduation-collection'
                },
                {
                  name: '2024',
                  href: '/programmes/jameel-house-of-traditional-arts-in-cairo/2024-graduation-collection'
                }
              ]
            }
          ]
        },
        {
          name: 'Pratham Jameel Second Chance Programme',
          href: '/programmes/pratham-jameel-second-chance'
        },
        {
          name: 'Jameel C40 Urban Planning Climate Labs',
          href: '/programmes/jameel-c40-urban-planning-climate-labs'
        },
        {
          name: 'Ejada',
          href: '/programmes/ejada'
        },
        {
          name: 'MIT Jameel Toyota Scholarship',
          href: '/programmes/jameel-toyota-scholarship'
        },
        {
          name: 'Ankur',
          children: [
            { name: 'Overview', href: '/programmes/ankur' },
            {
              name: 'Sundarbans folkindica biodiversity map',
              href: '/programmes/ankur/sundarbans-biodiversity-map'
            }
          ]
        },
        {
          name: 'BRUVS Monaco',
          href: '/programmes/bruvs-monaco'
        },
        {
          name: 'Funds',
          children: [
            {
              name: 'Jameel Fund',
              href: '/programmes/funds/jameel-fund'
            },
            {
              name: 'Iraq Cultural Health Fund',
              href: '/programmes/funds/iraq-cultural-health-fund'
            },
            {
              name: 'Covid-19-Excellence Fund',
              href: '/programmes/funds/covid-19-excellence-fund'
            }
          ]
        }
      ]
    },
    {
      name: 'Discover',
      icon: 'BeakerIcon',
      children: [
        { name: 'News', href: '/news' },
        { name: 'Media', href: '/media' },
        { name: 'Events', href: '/events' },
        { name: 'Studios', href: '/studios' },
        { name: 'Newsletter', href: '/newsletter' },
        { name: '2024 in review', href: '/reports/a-look-back-at-2024' },
        {
          name: 'Stories',
          children: [
            { name: 'A Cairo Cornerstone', href: '/stories/a-cairo-cornerstone' },
            { name: 'GCC Heat Tracker', href: '/stories/gcc-heat-tracker' },
            { name: 'Harvesting Hope', href: '/stories/harvesting-hope' },
            { name: 'KSA Healthcare Timeiline', href: '/stories/ksa-healthcare-timeline' }
          ]
        }
      ]
    }
  ];
  