---
component: tarifs
defaultPlan: ccom
plans:
  - slug: csimple
    icon: ccom-csimple
    subtitle: "Tarif diffusion"
    price: "80€ ht/mois*"
    footnote: "Contrat d’un an 960€ ht*"
    description: "Une offre essentielle pour diffuser un visuel créé par vos soins."
    moreInfoTitle: "Ce qui est inclus dans l'offre C'Simple"
    moreInfoContent: >-
      <p class={styles.centered}>- Prérequis -</p>
      <ul>
        <li>Vidéos ou visuels statiques fournis par le client dans le format requis par C'Com
        </li>
      </ul>
  - slug: ccom
    icon: ccom-ccom
    subtitle: "Tarif diffusion"
    price: "80€ ht/mois*"
    footnote: "Contrat d’un an 960€ ht*"
    description: "Nous créons pour vous un visuel percutant pour animer vos écrans."
    moreInfoTitle: "Ce qui est inclus dans l'offre C'Com"
    moreInfoContent: >-
      <p class={styles.centered}>- Option disponible -</p>
        <ul>
          <li>
          Création visuel statique (<span class={styles.bold}>150€ ht</span> par création produite par C'Com)
          </li>
        </ul>
      
  - slug: cpro
    icon: ccom-cpro
    subtitle: "Tarif diffusion"
    price: "80€ ht/mois*"
    footnote: "Contrat d’un an 960€ ht*"
    description: "Une formule complète pour vos campagnes vidéo multi-formats."
    moreInfoTitle: "Ce qui est inclus dans l'offre C'Pro"
    moreInfoContent: >-
      <p class={styles.centered}>- Options disponibles -</p>
        <ul>
          <li>
          Création visuel statique (<span class={styles.bold}>150€ ht</span>/création produite par C'Com)
          </li>
          <li>
          Création vidéo de 10 secondes par C'Com (<span class={styles.bold}>300€ ht</span> par création produite par C'Com)
          </li>
          <li>
          Création d'une vidéo drone | motion design (<span class={styles.bold}>Sur devis</span> uniquement)
          </li>
        </ul>
options:
  - id: static
    label: "Le visuel statique*"
    description: "Visuel de 10 secondes créé par C'Com"
    price: "150€ ht / achat unique"
    type: base
    defaultSelected: true
    defaultQuantity: 1
    minQuantity: 1
    unitPrice: 150
    priceSuffix: "€ ht / achat unique"
  - id: video-standard
    label: "La vidéo standard*"
    description: "Vidéo de 10 secondes créée par C'Com"
    price: "300€ ht / achat unique"
    type: video
    defaultQuantity: 0
    minQuantity: 0
    unitPrice: 300
    priceSuffix: "€ ht / achat unique"
  - id: video-premium
    label: "Vidéo drone* / motion design*"
    description: "Production sur devis selon vos besoins"
    price: "Sur devis"
    type: video
    showCounter: false
modal:
  title: "+ d'infos"
  content: >-
    <p>Chaque offre comprend l'installation, la programmation et la modification de vos campagnes (tous les trimestres) ainsi que leur diffusion (par boucle de 10 secondes toutes les 5 minutes).</p>
---
