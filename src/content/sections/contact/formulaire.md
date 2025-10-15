---
component: contact-form
title: "Contactez-nous !"
subtitle: "Choisissez la formule qui correspond à votre projet et partagez-nous vos informations pour être recontacté rapidement."

formulas:
  - id: csimple
    label: "C'SIMPLE"
    description: "Pour les structures qui disposent déjà de leurs visuels et souhaitent les programmer sur leurs écrans."
    helper: "Un membre de l'équipe vous répond sous 24h ouvrées."
    fields:
      - id: lastName
        label: "Nom"
      - id: firstName
        label: "Prénom"
      - id: email
        label: "Adresse mail"
        type: email
      - id: phone
        label: "Téléphone"
        type: tel
      - id: company
        label: "Structure"
      - id: industry
        label: "Secteur d'activité"
      - id: address
        label: "Adresse"
      - id: postalCode
        label: "Code postal"
      - id: city
        label: "Ville"
      - id: siret
        label: "Numéro de SIRET"
      - id: commitmentDuration
        label: "Durée d'engagement"
        type: select
        options:
          - label: "12 mois"
            value: "12-mois"
          - label: "24 mois"
            value: "24-mois"
          - label: "36 mois"
            value: "36-mois"
      - id: customRequest
        label: "Demande particulière"
        type: textarea
        placeholder: "Précisez vos besoins"
        required: false

  - id: ccom
    label: "C'COM"
    description: "La solution idéale pour déléguer la création de vos visuels et animer vos écrans toute l'année."
    helper: "Indiquez-nous vos besoins, nous nous chargeons du reste."
    fields:
      - id: lastName
        label: "Nom"
      - id: firstName
        label: "Prénom"
      - id: email
        label: "Adresse mail"
        type: email
      - id: phone
        label: "Téléphone"
        type: tel
      - id: company
        label: "Structure"
      - id: industry
        label: "Secteur d'activité"
      - id: address
        label: "Adresse"
      - id: postalCode
        label: "Code postal"
      - id: city
        label: "Ville"
      - id: siret
        label: "Numéro de SIRET"
      - id: commitmentDuration
        label: "Durée d'engagement"
        type: select
        options:
          - label: "12 mois"
            value: "12-mois"
          - label: "24 mois"
            value: "24-mois"
          - label: "36 mois"
            value: "36-mois"
      - id: visuals
        label: "Visuel(s)"
        type: number
        required: false
        min: 0
        step: 1
      - id: customRequest
        label: "Demande particulière"
        type: textarea
        placeholder: "Précisez vos besoins"
        required: false

  - id: cpro
    label: "C'PRO"
    description: "Un accompagnement sur-mesure pour vos campagnes vidéo, motion design ou drone."
    helper: "Partagez quelques détails clés et nous construirons une proposition adaptée."
    fields:
      - id: lastName
        label: "Nom"
      - id: firstName
        label: "Prénom"
      - id: email
        label: "Adresse mail"
        type: email
      - id: phone
        label: "Téléphone"
        type: tel
      - id: company
        label: "Structure"
      - id: industry
        label: "Secteur d'activité"
      - id: address
        label: "Adresse"
      - id: postalCode
        label: "Code postal"
      - id: city
        label: "Ville"
      - id: siret
        label: "Numéro de SIRET"
      - id: commitmentDuration
        label: "Durée d'engagement"
        type: select
        options:
          - label: "12 mois"
            value: "12-mois"
          - label: "24 mois"
            value: "24-mois"
          - label: "36 mois"
            value: "36-mois"
      - id: visuals
        label: "Visuel(s)"
        type: number
        required: false
        min: 0
        step: 1
      - id: videos
        label: "Vidéo(s)"
        type: number
        required: false
        min: 0
        step: 1
      - id: customRequest
        label: "Demande particulière"
        type: textarea
        placeholder: "Décrivez votre projet"
        required: false

defaultFormula: cpro
submitLabel: "Envoyer"
successMessage: "Merci pour votre message ! Nous revenons vers vous rapidement."
---