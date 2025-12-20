/**
 * PayloadAdapter - Responsável por adaptar os dados vindos do frontend
 * para o formato esperado pelos templates Handlebars.
 */
export class PayloadAdapter {
  /**
   * Monta o endereço completo a partir dos campos separados
   * @param client Objeto com campos de endereço (logradouro, numero, complemento, bairro, cidadeEstado)
   * @returns String com endereço completo formatado
   */
  static buildFullAddress(client: any): string {
    if (!client) return '';
    
    // Se já existe address montado, retorna ele
    if (client.address) return client.address;
    
    // Monta a partir dos campos separados
    const parts = [
      client.logradouro,
      client.numero,
      client.complemento,
      client.bairro,
      client.cidadeEstado,
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Adapta o payload do frontend para o formato esperado pelos templates
   */
  static adapt(
    extraData: Record<string, any>,
    templateTitle: string,
  ): Record<string, any> {
    const adapted = { ...extraData };

    // ========== ADAPTAÇÕES GERAIS (para todos os documentos) ==========
    
    // Mover campos de cliente do nível raiz para dentro de client
    if ('rg' in extraData && !adapted.client?.rg) {
      adapted.client = adapted.client || {};
      adapted.client.rg = extraData.rg;
      delete adapted.rg;
    }
    if ('cpf' in extraData && !adapted.client?.cpf) {
      adapted.client = adapted.client || {};
      adapted.client.cpf = extraData.cpf;
      delete adapted.cpf;
    }

    // Conversão geral: documentDate (ISO) -> day/month/year
    if (adapted.document?.documentDate) {
      const date = new Date(adapted.document.documentDate);
      adapted.document.day = date.getDate().toString().padStart(2, '0');
      adapted.document.month = (date.getMonth() + 1).toString().padStart(2, '0');
      adapted.document.year = date.getFullYear().toString();
      delete adapted.document.documentDate;
    }

    // Conversão geral: documentLocation -> location
    if (adapted.document?.documentLocation) {
      adapted.document.location = adapted.document.documentLocation;
      delete adapted.document.documentLocation;
    }

    // Normalizar endereço: se vier campos separados, montar address completo
    if (adapted.client) {
      // Se vier campos separados do frontend, montar address
      if (adapted.client.logradouro && !adapted.client.address) {
        adapted.client.address = this.buildFullAddress(adapted.client);
      }
      // Se vier address antigo (string), manter compatibilidade
      // Se vier campos separados (logradouro, numero, etc), montar address
      else if (!adapted.client.address && (adapted.client.logradouro || adapted.client.street)) {
        // Tenta montar de campos separados
        const addressParts = [
          adapted.client.logradouro || adapted.client.street,
          adapted.client.numero || adapted.client.number,
          adapted.client.complemento || adapted.client.complement,
          adapted.client.bairro || adapted.client.neighborhood,
          adapted.client.cidadeEstado || (adapted.client.city && adapted.client.state ? `${adapted.client.city}/${adapted.client.state}` : ''),
        ].filter(Boolean);
        if (addressParts.length > 0) {
          adapted.client.address = addressParts.join(', ');
        }
      }
    }

    // ========== ADAPTAÇÕES ESPECÍFICAS POR DOCUMENTO ==========

    switch (templateTitle) {
      case 'Declaração de Não Recebimento':
        return this.adaptDeclaracaoNaoRecebimento(adapted);
      
      case 'Autodeclaração Rural':
        return this.adaptAutodeclaracaoRural(adapted);
      
      case 'Procuração e Declaração Judicial':
        return this.adaptProcuracaoDeclaracaoJudicial(adapted);
      
      case 'Procuração Pessoa Física':
        return this.adaptProcuracaoPessoaFisica(adapted);
      
      case 'LOAS - Auxílio-Doença':
        return this.adaptLoasAuxilioDoenca(adapted);
      
      case 'LOAS - Benefício para Deficiente':
        return this.adaptLoasBeneficioDeficiente(adapted);
      
      case 'LOAS - Idoso':
        return this.adaptLoasIdoso(adapted);
      
      case 'Procuração INSS':
        return this.adaptProcuracaoInss(adapted);
      
      case 'Contrato de Honorários':
        return this.adaptContratoHonorarios(adapted);
      
      default:
        return adapted;
    }
  }

  // ========== MÉTODOS DE ADAPTAÇÃO ESPECÍFICOS ==========

  private static adaptDeclaracaoNaoRecebimento(data: Record<string, any>): Record<string, any> {
    // Converter receivesRetirementPension para benefit.receives
    if ('receivesRetirementPension' in data) {
      data.benefit = data.benefit || {};
      data.benefit.receives = data.receivesRetirementPension === 'sim';
      delete data.receivesRetirementPension;
    }

    // Mover location para document.location
    if ('location' in data && !data.document?.location) {
      data.document = data.document || {};
      data.document.location = data.location;
      delete data.location;
    }

    // Converter statementDate para document.day/month/year
    if ('statementDate' in data) {
      const date = new Date(data.statementDate);
      data.document = data.document || {};
      data.document.day = date.getDate().toString().padStart(2, '0');
      data.document.month = (date.getMonth() + 1).toString().padStart(2, '0');
      data.document.year = date.getFullYear().toString();
      delete data.statementDate;
    }

    // Remover campos obsoletos
    delete data.fullName;
    delete data.originatingEntity;

    return data;
  }

  private static adaptAutodeclaracaoRural(data: Record<string, any>): Record<string, any> {
    // Converter fullName para name
    if ('fullName' in data && !data.name) {
      data.name = data.fullName;
      delete data.fullName;
    }

    // Converter birthDate para dateOfBirth
    if ('birthDate' in data && !data.dateOfBirth) {
      data.dateOfBirth = data.birthDate;
      delete data.birthDate;
    }

    // Juntar endereço fragmentado
    if ('address' in data && 'addressNumber' in data) {
      const addressParts = [
        data.address,
        data.addressNumber,
        data.addressNeighborhood,
      ].filter(Boolean);
      data.address = addressParts.join(', ');
    }

    // Converter addressCity -> city e addressState -> state
    if ('addressCity' in data && !data.city) {
      data.city = data.addressCity;
      delete data.addressCity;
    }
    if ('addressState' in data && !data.state) {
      data.state = data.addressState;
      delete data.addressState;
    }

    // Converter properties para ruralActivityPeriods
    if ('properties' in data && Array.isArray(data.properties)) {
      if (!data.ruralActivityPeriods) {
        data.ruralActivityPeriods = data.properties;
      }
      delete data.properties;
    }

    // Converter familyEconomyCondition para familyEconomy
    if ('familyEconomyCondition' in data) {
      data.familyEconomy = {
        isHolder: data.familyEconomyCondition === 'titular',
        isComponent: data.familyEconomyCondition === 'componente',
      };
      delete data.familyEconomyCondition;
    }

    // Remover campos não usados
    const fieldsToRemove = [
      'addressNumber', 'addressNeighborhood', 'addressZipCode',
      'declarationDate', 'declarationLocation', 'expirationDate',
      'hasEmployees', 'hasIpiTax', 'ipiPeriod',
      'isCooperativeMember', 'cooperativeEntity', 'cooperativeCnpj', 'cooperativeType',
      'hasOtherActivityOrIncome', 'hasSpecificIncomeSources'
    ];
    fieldsToRemove.forEach(field => delete data[field]);

    return data;
  }

  private static adaptProcuracaoDeclaracaoJudicial(data: Record<string, any>): Record<string, any> {
    // Mover campos do grantor para client
    if ('grantorFullName' in data) {
      data.client = data.client || {};
      data.client.nationality = data.grantorNationality || data.client.nationality;
      delete data.grantorFullName;
      delete data.grantorNationality;
      delete data.grantorCpf;
    }

    // Mover campos de endereço
    if ('grantorStreet' in data) {
      const addressParts = [
        data.grantorStreet,
        data.grantorStreetNumber,
        data.grantorNeighborhood,
        data.grantorCity,
        data.grantorState,
      ].filter(Boolean);
      
      if (data.client) {
        data.client.address = addressParts.join(', ');
      }

      delete data.grantorStreet;
      delete data.grantorStreetNumber;
      delete data.grantorNeighborhood;
      delete data.grantorCity;
      delete data.grantorState;
      delete data.grantorZipCode;
    }

    // Converter documentDate e documentLocation
    if ('documentDate' in data && !data.document?.day) {
      const date = new Date(data.documentDate);
      data.document = data.document || {};
      data.document.day = date.getDate().toString().padStart(2, '0');
      data.document.month = (date.getMonth() + 1).toString().padStart(2, '0');
      data.document.year = date.getFullYear().toString();
      delete data.documentDate;
    }

    if ('documentLocation' in data && !data.document?.location) {
      data.document = data.document || {};
      data.document.location = data.documentLocation;
      delete data.documentLocation;
    }

    return data;
  }

  private static adaptProcuracaoPessoaFisica(data: Record<string, any>): Record<string, any> {
    // Similar à Procuração Judicial
    return this.adaptProcuracaoDeclaracaoJudicial(data);
  }

  private static adaptLoasAuxilioDoenca(data: Record<string, any>): Record<string, any> {
    // Mover campos do nível raiz para client
    if ('fullName' in data) {
      data.client = data.client || {};
      data.client.name = data.fullName;
      data.client.nationality = data.nationality || data.client.nationality;
      delete data.fullName;
      delete data.nationality;
    }

    // Montar endereço
    if ('street' in data) {
      const addressParts = [
        data.street,
        data.number,
        data.neighborhood,
        data.city,
        data.state,
      ].filter(Boolean);
      
      if (data.client) {
        data.client.address = addressParts.join(', ');
        data.client.cep = data.zipCode;
      }

      delete data.street;
      delete data.number;
      delete data.neighborhood;
      delete data.city;
      delete data.state;
      delete data.zipCode;
    }

    if ('occupation' in data && typeof data.occupation === 'string') {
      const occupationValue = data.occupation;
      data.occupation = {
        title: occupationValue,
      };
    }

    // Mapear campos para estrutura esperada
    const fieldMappings: Record<string, string> = {
      'jurisdiction': 'document.juizado',
      'caseValue': 'document.valorCausa',
      'caseValueInWords': 'document.valorCausaExtenso',
      'expertSpecialty': 'document.especialidadePericia',
      'deniedBenefitNumber': 'benefit.number',
      'requestedBenefit': 'benefit.requested',
      'denialDate': 'benefit.denialDate',
      'der': 'benefit.der',
      'denialReason': 'benefit.denialReason',
      'illness': 'disease.name',
      'medicalDiagnosis': 'disease.name',
      'mainSymptoms': 'disease.symptoms',
      'resultingLimitations': 'disease.limitations',
      'medicalInconsistencies': 'disease.inconsistencies',
      'occupationDescription': 'occupation.description',
      'generalWorkConditions': 'occupation.conditions',
    };

    for (const [oldKey, newPath] of Object.entries(fieldMappings)) {
      if (oldKey in data) {
        const parts = newPath.split('.');
        if (parts.length === 2) {
          data[parts[0]] = data[parts[0]] || {};
          data[parts[0]][parts[1]] = data[oldKey];
        }
        delete data[oldKey];
      }
    }

    // Remover campos não mapeados
    const fieldsToRemove = [
      'waiverClause', 'legalFoundation', 'legalRequirements',
      'benefitRequestDate', 'summaryDescription', 'workCapacityConclusion',
      'jurisdictionCompetenceClause', 'requiredBenefitNumber'
    ];
    fieldsToRemove.forEach(field => delete data[field]);

    return data;
  }

  private static adaptLoasBeneficioDeficiente(data: Record<string, any>): Record<string, any> {
    // Similar ao LOAS Auxílio-Doença
    if ('fullName' in data) {
      data.client = data.client || {};
      data.client.name = data.fullName;
      data.client.nationality = data.nationality || data.client.nationality;
      data.client.dateOfBirth = data.birthDate;
      delete data.fullName;
      delete data.nationality;
      delete data.birthDate;
    }

    // Montar endereço
    if ('street' in data) {
      const addressParts = [
        data.street,
        data.number,
        data.neighborhood,
        data.city,
        data.state,
      ].filter(Boolean);
      
      if (data.client) {
        data.client.address = addressParts.join(', ');
        data.client.cep = data.zipCode;
      }

      delete data.street;
      delete data.number;
      delete data.neighborhood;
      delete data.city;
      delete data.state;
      delete data.zipCode;
    }

    // Mapear campos
    const fieldMappings: Record<string, string> = {
      'jurisdiction': 'document.juizado',
      'caseValue': 'document.valorCausa',
      'expertSpecialty': 'document.especialidadePericia',
      'medicalExpertSpecialty': 'document.especialidadePericia',
      'deniedBenefitNumber': 'document.numeroBeneficio',
      'denialDate': 'document.dataIndeferimento',
      'medicalReason': 'document.condicaoMedica',
      'preliminaries': 'document.preliminares',
      'familyCompositionDescription': 'document.composicaoFamiliar',
    };

    for (const [oldKey, newPath] of Object.entries(fieldMappings)) {
      if (oldKey in data) {
        const parts = newPath.split('.');
        if (parts.length === 2) {
          data[parts[0]] = data[parts[0]] || {};
          data[parts[0]][parts[1]] = data[oldKey];
        }
        delete data[oldKey];
      }
    }

    return data;
  }

  private static adaptLoasIdoso(data: Record<string, any>): Record<string, any> {
    // Similar aos outros LOAS
    if ('fullName' in data) {
      data.client = data.client || {};
      data.client.name = data.fullName;
      data.client.nationality = data.nationality || data.client.nationality;
      data.client.dateOfBirth = data.birthDate;
      data.client.motherName = data.motherName;
      delete data.fullName;
      delete data.nationality;
      delete data.birthDate;
      delete data.motherName;
    }

    // Montar endereço
    if ('street' in data) {
      const addressParts = [
        data.street,
        data.number,
        data.complement,
        data.neighborhood,
        data.city,
        data.state,
      ].filter(Boolean);
      
      if (data.client) {
        data.client.address = addressParts.join(', ');
        data.client.cep = data.zipCode;
      }

      delete data.street;
      delete data.number;
      delete data.complement;
      delete data.neighborhood;
      delete data.city;
      delete data.state;
      delete data.zipCode;
    }

    // Mapear campos
    const fieldMappings: Record<string, string> = {
      'jurisdiction': 'document.juizado',
      'caseValue': 'document.valorCausa',
      'caseValueForTaxPurposes': 'document.valorCausaFiscal',
      'benefitNumber': 'benefit.number',
      'cessationDate': 'benefit.cessationDate',
      'livingSituation': 'benefit.livingArrangement',
    };

    for (const [oldKey, newPath] of Object.entries(fieldMappings)) {
      if (oldKey in data) {
        const parts = newPath.split('.');
        if (parts.length === 2) {
          data[parts[0]] = data[parts[0]] || {};
          data[parts[0]][parts[1]] = data[oldKey];
        }
        delete data[oldKey];
      }
    }

    return data;
  }

  private static adaptProcuracaoInss(data: Record<string, any>): Record<string, any> {
    // Converter date para document.day/month/year
    if ('date' in data && !data.document?.day) {
      const date = new Date(data.date);
      data.document = data.document || {};
      data.document.day = date.getDate().toString().padStart(2, '0');
      data.document.month = (date.getMonth() + 1).toString().padStart(2, '0');
      data.document.year = date.getFullYear().toString();
      delete data.date;
    }

    // Converter location para document.location
    if ('location' in data && !data.document?.location) {
      data.document = data.document || {};
      data.document.location = data.location;
      delete data.location;
    }

    // Mapear poderes (powers)
    if (!data.powers && (
      'registerPasswordInternet' in data ||
      'proofOfLifeBanking' in data ||
      'receivePaymentsInability' in data
    )) {
      data.powers = {
        passwordRegistration: data.registerPasswordInternet,
        proofOfLife: data.proofOfLifeBanking,
        receivePayments: false, // não está no payload
        reasonInability: data.receivePaymentsInability,
        reasonDomesticTravel: data.receivePaymentsTravelWithinCountry,
        domesticTravelPeriod: data.travelWithinCountryPeriod || '',
        reasonInternationalTravel: data.receivePaymentsTravelAbroad,
        internationalTravelPeriod: data.travelAbroadPeriod || '',
        reasonLivingAbroad: data.receivePaymentsResidenceAbroad,
        countryOfResidence: data.residenceAbroadCountry || '',
        requestBenefits: data.requestBenefits,
        otherRequest: data.otherRequest,
        otherRequestDescription: data.otherRequestDescription || '',
      };

      // Remover campos originais
      delete data.registerPasswordInternet;
      delete data.proofOfLifeBanking;
      delete data.receivePaymentsInability;
      delete data.receivePaymentsTravelWithinCountry;
      delete data.travelWithinCountryPeriod;
      delete data.receivePaymentsTravelAbroad;
      delete data.travelAbroadPeriod;
      delete data.receivePaymentsResidenceAbroad;
      delete data.residenceAbroadCountry;
      delete data.requestBenefits;
      delete data.otherRequest;
      delete data.otherRequestDescription;
    }

    // Remover templateId se existir
    delete data.templateId;

    return data;
  }

  private static adaptContratoHonorarios(data: Record<string, any>): Record<string, any> {
    // Mover campos do client
    if ('clientFullName' in data) {
      data.client = data.client || {};
      data.client.nationality = data.clientNationality || data.client.nationality;
      delete data.clientFullName;
      delete data.clientCpf;
      delete data.clientNationality;
    }

    // Montar endereço
    if ('clientStreet' in data) {
      const addressParts = [
        data.clientStreet,
        data.clientStreetNumber,
        data.clientNeighborhood,
        data.clientCity,
        data.clientState,
      ].filter(Boolean);
      
      if (data.client) {
        data.client.address = addressParts.join(', ');
      }

      delete data.clientStreet;
      delete data.clientStreetNumber;
      delete data.clientNeighborhood;
      delete data.clientCity;
      delete data.clientState;
      delete data.clientZipCode;
    }

    // Converter documentDate e documentLocation
    if ('documentDate' in data && !data.document?.day) {
      const date = new Date(data.documentDate);
      data.document = data.document || {};
      data.document.day = date.getDate().toString().padStart(2, '0');
      data.document.month = (date.getMonth() + 1).toString().padStart(2, '0');
      data.document.year = date.getFullYear().toString();
      delete data.documentDate;
    }

    if ('documentLocation' in data && !data.document?.location) {
      data.document = data.document || {};
      data.document.location = data.documentLocation;
      delete data.documentLocation;
    }

    // Mapear campos de honorários
    const fieldMappings: Record<string, string> = {
      'judicialSuccessPercentage': 'contract.judicialPercentage',
      'administrativeSuccessPercentage': 'contract.administrativePercentage',
      'judicialFutureInstallments': 'contract.judicialInstallments',
      'administrativeInstallments': 'contract.administrativeInstallments',
      'administrativeBenefitSalaries': 'contract.administrativeSalaries',
    };

    for (const [oldKey, newPath] of Object.entries(fieldMappings)) {
      if (oldKey in data) {
        const parts = newPath.split('.');
        if (parts.length === 2) {
          data[parts[0]] = data[parts[0]] || {};
          data[parts[0]][parts[1]] = data[oldKey];
        }
        delete data[oldKey];
      }
    }

    return data;
  }
}

