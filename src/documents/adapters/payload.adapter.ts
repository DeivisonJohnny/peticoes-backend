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
      adapted.document.month = (date.getMonth() + 1)
        .toString()
        .padStart(2, '0');
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
      else if (
        !adapted.client.address &&
        (adapted.client.logradouro || adapted.client.street)
      ) {
        // Tenta montar de campos separados
        const addressParts = [
          adapted.client.logradouro || adapted.client.street,
          adapted.client.numero || adapted.client.number,
          adapted.client.complemento || adapted.client.complement,
          adapted.client.bairro || adapted.client.neighborhood,
          adapted.client.cidadeEstado ||
            (adapted.client.city && adapted.client.state
              ? `${adapted.client.city}/${adapted.client.state}`
              : ''),
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

      case 'Termo de Representação INSS':
        return this.adaptTermoRepresentacaoInss(adapted);

      default:
        return adapted;
    }
  }

  // ========== MÉTODOS DE ADAPTAÇÃO ESPECÍFICOS ==========

  private static adaptDeclaracaoNaoRecebimento(
    data: Record<string, any>,
  ): Record<string, any> {
    // Mapear client (dados pessoais)
    data.client = data.client || {};

    if ('fullName' in data) {
      data.client.name = data.fullName;
      delete data.fullName;
    }

    // CPF e RG podem já ter sido movidos pelo adaptador geral
    if ('cpf' in data) {
      data.client.cpf = data.cpf;
      delete data.cpf;
    }

    if ('rg' in data) {
      data.client.rg = data.rg;
      delete data.rg;
    }

    // Mapear document (local e data)
    if ('location' in data) {
      data.document = data.document || {};
      data.document.location = data.location;
      delete data.location;
    }

    if ('statementDate' in data) {
      const date = new Date(data.statementDate);
      data.document = data.document || {};
      data.document.day = date.getDate().toString().padStart(2, '0');
      data.document.month = (date.getMonth() + 1).toString().padStart(2, '0');
      data.document.year = date.getFullYear().toString();
      delete data.statementDate;
    }

    // Mapear benefit (benefícios)
    data.benefit = data.benefit || {};

    // Recebe ou não benefício
    data.benefit.receives = data.receivesRetirementPension === 'sim';
    delete data.receivesRetirementPension;

    // Tipo de benefício
    data.benefit.isPension = data.benefitType === 'pensao';
    data.benefit.isRetirement = data.benefitType === 'aposentadoria';
    delete data.benefitType;

    // Relação com instituidor (cônjuge/companheiro)
    data.benefit.isSpouseRelation =
      data.relationshipWithProvider === 'conjuge' ||
      data.relationshipWithProvider === 'companheiro';
    delete data.relationshipWithProvider;

    // Ente de origem (pode ser array no frontend)
    const origins = Array.isArray(data.originatingEntity)
      ? data.originatingEntity
      : [data.originatingEntity];
    data.benefit.originEstadual = origins.includes('estadual');
    data.benefit.originMunicipal = origins.includes('municipal');
    data.benefit.originFederal = origins.includes('federal');
    delete data.originatingEntity;

    // Tipo de servidor
    data.benefit.serverCivil = data.serverType === 'civil';
    data.benefit.serverMilitar = data.serverType === 'militar';
    delete data.serverType;

    // Data de início do benefício
    if (data.benefitStartDate) {
      const startDate = new Date(data.benefitStartDate);
      data.benefit.startDay = startDate.getDate().toString().padStart(2, '0');
      data.benefit.startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
      data.benefit.startYear = startDate.getFullYear().toString();
      delete data.benefitStartDate;
    }

    // Nome do órgão
    if (data.benefitAgencyName) {
      data.benefit.agencyName = data.benefitAgencyName;
      delete data.benefitAgencyName;
    }

    // Última remuneração
    if (data.lastGrossSalary) {
      data.benefit.lastGrossSalary = data.lastGrossSalary;
      delete data.lastGrossSalary;
    }

    // Mês/ano do salário
    if (data.monthYearSalary) {
      const [year, month] = data.monthYearSalary.split('-');
      data.benefit.salaryMonth = month;
      data.benefit.salaryYear = year;
      delete data.monthYearSalary;
    }

    return data;
  }

  private static adaptAutodeclaracaoRural(
    data: Record<string, any>,
  ): Record<string, any> {
    // 1. Mapeamento de campos simples (Top Level)
    if ('fullName' in data && !data.name) {
      data.name = data.fullName;
      delete data.fullName;
    }
    if ('birthDate' in data && !data.dateOfBirth) {
      data.dateOfBirth = data.birthDate;
      delete data.birthDate;
    }
    if ('address' in data && 'addressNumber' in data) {
      const addressParts = [
        data.address,
        data.addressNumber,
        data.addressNeighborhood,
      ].filter(Boolean);
      data.address = addressParts.join(', ');
    }
    if ('addressCity' in data && !data.city) {
      data.city = data.addressCity;
      delete data.addressCity;
    }
    if ('addressState' in data && !data.state) {
      data.state = data.addressState;
      delete data.addressState;
    }
    if ('expirationDate' in data && !data.rgIssuer) {
      data.rgIssuer = data.expirationDate;
      delete data.expirationDate;
    }

    // 2. Section 2 - Rural Activity Periods (Matriz ruralPeriod)
    if (data.ruralPeriod && Array.isArray(data.ruralPeriod)) {
      data.ruralActivityPeriods = data.ruralPeriod.map((row: any[]) => {
        // row[0]: Periodo
        // row[1]: Condição
        // row[2]: Situação
        const situation = row[2] || '';
        return {
          period: row[0],
          propertyCondition: row[1],
          isIndividual: situation.toLowerCase().includes('individual'),
          isFamilyEconomy: situation
            .toLowerCase()
            .includes('economia familiar'),
        };
      });
      delete data.ruralPeriod;
    }

    // 2.1 Family Economy Condition
    if ('familyEconomyCondition' in data) {
      data.familyEconomy = {
        isHolder: data.familyEconomyCondition?.toLowerCase() === 'titular',
        isComponent:
          data.familyEconomyCondition?.toLowerCase() === 'componente',
      };
      delete data.familyEconomyCondition;
    }

    // 2.2 Family Members
    if (data.familyMembers && Array.isArray(data.familyMembers)) {
      data.familyMembers = data.familyMembers.map((member: any) => ({
        ...member,
        dateOfBirth: member.birthDate || member.dateOfBirth,
      }));
    }

    // 3. Section 3 - Land Leases (Matriz landCession)
    if (data.landCession && Array.isArray(data.landCession)) {
      data.landLeases = data.landCession.map((row: any[]) => ({
        leaseType: row[0],
        period: row[1],
        leasedAreaInHa: row[2],
      }));
      delete data.landCession;
    }

    // 3.1 Properties (Array de objetos)
    if (data.properties && Array.isArray(data.properties)) {
      data.properties = data.properties.map((prop: any) => ({
        itrRegistration: prop.itrRegistration,
        propertyName: prop.name || prop.propertyName,
        municipalityUf: prop.cityState || prop.municipalityUf,
        totalAreaInHa: prop.totalArea || prop.totalAreaInHa,
        exploredAreaInHa: prop.exploredArea || prop.exploredAreaInHa,
        ownerName: prop.ownerName,
        ownerCpf: prop.ownerCpf,
      }));
    }

    // 3.2 Explored Activities (Matriz ruralExploration)
    if (data.ruralExploration && Array.isArray(data.ruralExploration)) {
      data.exploredActivities = data.ruralExploration.map((row: any[]) => ({
        activity: row[0],
        purpose: row[1],
      }));
      delete data.ruralExploration;
    }

    // 3.3 IPI Info
    data.ipiInfo = {
      hasPayment: data.hasIpiTax === true,
      periods: [],
    };
    if (data.ipiPeriod) {
      data.ipiInfo.periods.push({ period: data.ipiPeriod });
    }
    delete data.hasIpiTax;
    delete data.ipiPeriod;

    // 3.4 Employee Info (Matriz employeesDetails)
    data.employeeInfo = {
      hasEmployees: data.hasEmployees === true,
      employees: [],
    };
    if (data.employeesDetails && Array.isArray(data.employeesDetails)) {
      data.employeeInfo.employees = data.employeesDetails.map((row: any[]) => ({
        name: row[0],
        cpf: row[1],
        period: row[2],
      }));
      delete data.employeesDetails;
    }
    delete data.hasEmployees;

    // 4. Section 4 - Other Income (Matriz otherActivitiesIncome)
    data.otherIncomeInfo = {
      hasOtherIncome: data.hasOtherActivityOrIncome === true,
      incomes: [],
    };
    if (
      data.otherActivitiesIncome &&
      Array.isArray(data.otherActivitiesIncome)
    ) {
      data.otherIncomeInfo.incomes = data.otherActivitiesIncome.map(
        (row: any[]) => ({
          activity: row[0],
          location: row[1],
          period: row[2],
        }),
      );
      delete data.otherActivitiesIncome;
    }
    delete data.hasOtherActivityOrIncome;

    // 4.1 Special Income Sources (Matriz specificIncomeSources)
    data.specialIncomeInfo = {
      hasIncome: data.hasSpecificIncomeSources === true,
      incomes: [],
    };
    if (
      data.specificIncomeSources &&
      Array.isArray(data.specificIncomeSources)
    ) {
      data.specialIncomeInfo.incomes = data.specificIncomeSources.map(
        (row: any[]) => ({
          activity: row[0],
          period: row[1],
          incomeBrl: row[2],
          details: row[3],
        }),
      );
      delete data.specificIncomeSources;
    }
    delete data.hasSpecificIncomeSources;

    // 4.2 Cooperative Info
    data.cooperativeInfo = {
      isMember: data.isCooperativeMember === true,
      cooperatives: [],
    };
    if (data.cooperativeEntity) {
      data.cooperativeInfo.cooperatives.push({
        entity: data.cooperativeEntity,
        cnpj: data.cooperativeCnpj,
        type: data.cooperativeType,
      });
    }
    delete data.isCooperativeMember;
    delete data.cooperativeEntity;
    delete data.cooperativeCnpj;
    delete data.cooperativeType;

    // Footer - Declaration Location/Date
    if (data.declarationLocation && !data.documentLocation) {
      data.documentLocation = data.declarationLocation;
      delete data.declarationLocation;
    }
    if (data.declarationDate && !data.documentDate) {
      data.documentDate = data.declarationDate;
      delete data.declarationDate;
    }

    // Remover campos residuais
    const fieldsToRemove = [
      'addressNumber',
      'addressNeighborhood',
      'addressZipCode',
    ];
    fieldsToRemove.forEach((field) => delete data[field]);

    return data;
  }

  private static adaptProcuracaoDeclaracaoJudicial(
    data: Record<string, any>,
  ): Record<string, any> {
    // Mover campos do grantor para client
    if ('grantorFullName' in data) {
      data.client = data.client || {};
      data.client.nationality =
        data.grantorNationality || data.client.nationality;
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

  private static adaptProcuracaoPessoaFisica(
    data: Record<string, any>,
  ): Record<string, any> {
    // Similar à Procuração Judicial
    return this.adaptProcuracaoDeclaracaoJudicial(data);
  }

  private static adaptLoasAuxilioDoenca(
    data: Record<string, any>,
  ): Record<string, any> {
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
      jurisdiction: 'document.juizado',
      caseValue: 'document.valorCausa',
      caseValueInWords: 'document.valorCausaExtenso',
      expertSpecialty: 'document.especialidadePericia',
      deniedBenefitNumber: 'benefit.number',
      requestedBenefit: 'benefit.requested',
      denialDate: 'benefit.denialDate',
      der: 'benefit.der',
      denialReason: 'benefit.denialReason',
      illness: 'disease.name',
      medicalDiagnosis: 'disease.name',
      mainSymptoms: 'disease.symptoms',
      resultingLimitations: 'disease.limitations',
      medicalInconsistencies: 'disease.inconsistencies',
      occupationDescription: 'occupation.description',
      generalWorkConditions: 'occupation.conditions',
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

    // Adicionar valor padrão para benefício requerido se não fornecido
    if (data.benefit && !data.benefit.requested) {
      data.benefit.requested =
        'Auxílio por incapacidade temporária ou Aposentadoria por incapacidade permanente';
    }

    // Adicionar inconsistências padrão se não fornecida
    if (data.disease && !data.disease.inconsistencies) {
      data.disease.inconsistencies =
        'O perito da Autarquia <span class="bold">NÃO RECONHECE A INCAPACIDADE</span> da Segurado, todavia, tal conclusão é divergente dos documentos médicos apresentados que indicavam a existência de incapacidade laborativa.';
    }

    // Remover campos não mapeados
    const fieldsToRemove = [
      'waiverClause',
      'legalFoundation',
      'legalRequirements',
      'benefitRequestDate',
      'summaryDescription',
      'workCapacityConclusion',
      'jurisdictionCompetenceClause',
      'requiredBenefitNumber',
    ];
    fieldsToRemove.forEach((field) => delete data[field]);

    return data;
  }

  private static adaptLoasBeneficioDeficiente(
    data: Record<string, any>,
  ): Record<string, any> {
    // Similar ao LOAS Auxílio-Doença
    if ('fullName' in data) {
      data.client = data.client || {};
      data.client.name = data.fullName;
      data.client.nationality = data.nationality || data.client.nationality;
      data.client.dateOfBirth = data.birthDate;
      // cpf já pode ter sido movido pelo adaptador geral
      if (!data.client.cpf && data.cpf) {
        data.client.cpf = data.cpf;
        delete data.cpf;
      }
      if (data.phone) {
        data.client.phone = data.phone;
        delete data.phone;
      }
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
      jurisdiction: 'document.juizado',
      caseValue: 'document.valorCausa',
      expertSpecialty: 'document.especialidadePericia',
      medicalExpertSpecialty: 'document.especialidadePericia',
      deniedBenefitNumber: 'document.numeroBeneficio',
      denialDate: 'document.dataIndeferimento',
      medicalReason: 'document.condicaoMedica',
      preliminaries: 'document.preliminares',
      familyCompositionDescription: 'document.composicaoFamiliar',
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

  private static adaptLoasIdoso(
    data: Record<string, any>,
  ): Record<string, any> {
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
      jurisdiction: 'document.juizado',
      caseValue: 'document.valorCausa',
      caseValueForTaxPurposes: 'document.valorCausaFiscal',
      benefitNumber: 'benefit.number',
      cessationDate: 'benefit.cessationDate',
      livingSituation: 'benefit.livingArrangement',
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

  private static adaptProcuracaoInss(
    data: Record<string, any>,
  ): Record<string, any> {
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

    // Processar dados do grantor (outorgante)
    if (data.grantor) {
      // Adicionar cityState ao grantor
      if (data.grantor.city && data.grantor.state) {
        data.grantor.cityState = `${data.grantor.city}/${data.grantor.state}`;
      }
      // Mapear identity para rg e profession para occupation
      if (data.grantor.identity) {
        data.grantor.rg = data.grantor.identity;
        delete data.grantor.identity;
      }
      if (data.grantor.profession) {
        data.grantor.occupation = data.grantor.profession;
        delete data.grantor.profession;
      }
      // Mapear address para street
      if (data.grantor.address && !data.grantor.street) {
        data.grantor.street = data.grantor.address;
        delete data.grantor.address;
      }
    }

    // Renomear grantee para attorney (procurador) e processar dados
    if (data.grantee) {
      data.attorney = data.grantee;
      delete data.grantee;

      // Adicionar cityState ao attorney
      if (data.attorney.city && data.attorney.state) {
        data.attorney.cityState = `${data.attorney.city}/${data.attorney.state}`;
      }
      // Mapear identity para rg e profession para occupation
      if (data.attorney.identity) {
        data.attorney.rg = data.attorney.identity;
        delete data.attorney.identity;
      }
      if (data.attorney.profession) {
        data.attorney.occupation = data.attorney.profession;
        delete data.attorney.profession;
      }
      // Mapear address para street
      if (data.attorney.address && !data.attorney.street) {
        data.attorney.street = data.attorney.address;
        delete data.attorney.address;
      }
    }

    // Mapear poderes (powers)
    if (
      !data.powers &&
      ('registerPasswordInternet' in data ||
        'proofOfLifeBanking' in data ||
        'receivePaymentsInability' in data)
    ) {
      data.powers = {
        passwordRegistration: data.registerPasswordInternet,
        proofOfLife: data.proofOfLifeBanking,
        receivePayments:
          data.receivePaymentsInability ||
          data.receivePaymentsTravelWithinCountry ||
          data.receivePaymentsTravelAbroad ||
          data.receivePaymentsResidenceAbroad,
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

  private static adaptContratoHonorarios(
    data: Record<string, any>,
  ): Record<string, any> {
    // Mover campos do client
    if ('clientFullName' in data) {
      data.client = data.client || {};
      data.client.nationality =
        data.clientNationality || data.client.nationality;
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
      judicialSuccessPercentage: 'contract.judicialPercentage',
      administrativeSuccessPercentage: 'contract.administrativePercentage',
      judicialFutureInstallments: 'contract.judicialInstallments',
      administrativeInstallments: 'contract.administrativeInstallments',
      administrativeBenefitSalaries: 'contract.administrativeSalaries',
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

    // Adicionar campos por extenso
    if (data.contract) {
      if (data.contract.administrativeSalaries) {
        data.contract.administrativeSalariesInWords = this.numberToWords(
          data.contract.administrativeSalaries,
        );
      }
      if (data.contract.administrativeInstallments) {
        data.contract.administrativeInstallmentsInWords = this.numberToWords(
          data.contract.administrativeInstallments,
        );
      }
      if (data.contract.judicialInstallments) {
        data.contract.judicialInstallmentsInWords = this.numberToWords(
          data.contract.judicialInstallments,
        );
      }
    }

    return data;
  }

  /**
   * Converte números em texto por extenso
   */
  private static numberToWords(number: string | number): string {
    const num = typeof number === 'string' ? parseInt(number, 10) : number;
    const unidades = [
      '',
      'um',
      'dois',
      'três',
      'quatro',
      'cinco',
      'seis',
      'sete',
      'oito',
      'nove',
    ];
    const especiais = [
      'dez',
      'onze',
      'doze',
      'treze',
      'catorze',
      'quinze',
      'dezesseis',
      'dezessete',
      'dezoito',
      'dezenove',
    ];
    const dezenas = [
      '',
      '',
      'vinte',
      'trinta',
      'quarenta',
      'cinquenta',
      'sessenta',
      'setenta',
      'oitenta',
      'noventa',
    ];
    const centenas = [
      '',
      'cento',
      'duzentos',
      'trezentos',
      'quatrocentos',
      'quinhentos',
      'seiscentos',
      'setecentos',
      'oitocentos',
      'novecentos',
    ];

    if (num === 0) return 'zero';
    if (num < 10) return unidades[num];
    if (num >= 10 && num < 20) return especiais[num - 10];
    if (num >= 20 && num < 100) {
      const dezena = Math.floor(num / 10);
      const unidade = num % 10;
      return dezenas[dezena] + (unidade > 0 ? ' e ' + unidades[unidade] : '');
    }
    if (num === 100) return 'cem';
    if (num > 100 && num < 1000) {
      const centena = Math.floor(num / 100);
      const resto = num % 100;
      return (
        centenas[centena] + (resto > 0 ? ' e ' + this.numberToWords(resto) : '')
      );
    }

    return number.toString();
  }

  private static adaptTermoRepresentacaoInss(data: Record<string, any>): Record<string, any> {
    // Converter documentDate para document.day/month/year
    if ('documentDate' in data && !data.document?.day) {
      const date = new Date(data.documentDate);
      data.document = data.document || {};
      data.document.day = date.getDate().toString().padStart(2, '0');
      data.document.month = (date.getMonth() + 1).toString().padStart(2, '0');
      data.document.year = date.getFullYear().toString();
      delete data.documentDate;
    }

    // Mover location para document.location
    if ('location' in data && !data.document?.location) {
      data.document = data.document || {};
      data.document.location = data.location;
      delete data.location;
    }

    // Mapear represented (representado)
    if ('representedName' in data) {
      data.represented = {
        name: data.representedName,
        cpf: data.representedCpf,
        rg: data.representedRg,
        address: data.representedAddress,
        city: data.representedCity,
        cep: data.representedCep,
      };
      delete data.representedName;
      delete data.representedCpf;
      delete data.representedRg;
      delete data.representedAddress;
      delete data.representedCity;
      delete data.representedCep;
    }

    // Mapear attorney (advogado)
    if ('attorneyName' in data) {
      data.attorney = {
        name: data.attorneyName,
        cpf: data.attorneyCpf,
        oab: data.attorneyOab,
        nit: data.attorneyNit,
      };
      delete data.attorneyName;
      delete data.attorneyCpf;
      delete data.attorneyOab;
      delete data.attorneyNit;
    }

    // Mapear benefits (benefícios)
    data.benefits = {
      retirementAge: data.retirementAge || false,
      retirementAgeUrban: data.retirementAgeUrban || false,
      retirementAgeRural: data.retirementAgeRural || false,
      retirementContributionTime: data.retirementContributionTime || false,
      retirementSpecial: data.retirementSpecial || false,
      pensionDeath: data.pensionDeath || false,
      pensionDeathUrban: data.pensionDeathUrban || false,
      pensionDeathRural: data.pensionDeathRural || false,
      reclusionAid: data.reclusionAid || false,
      reclusionAidUrban: data.reclusionAidUrban || false,
      reclusionAidRural: data.reclusionAidRural || false,
      maternityPay: data.maternityPay || false,
      maternityPayUrban: data.maternityPayUrban || false,
      maternityPayRural: data.maternityPayRural || false,
      cadastralUpdate: data.cadastralUpdate || false,
    };

    // Remover campos originais
    delete data.retirementAge;
    delete data.retirementAgeUrban;
    delete data.retirementAgeRural;
    delete data.retirementContributionTime;
    delete data.retirementSpecial;
    delete data.pensionDeath;
    delete data.pensionDeathUrban;
    delete data.pensionDeathRural;
    delete data.reclusionAid;
    delete data.reclusionAidUrban;
    delete data.reclusionAidRural;
    delete data.maternityPay;
    delete data.maternityPayUrban;
    delete data.maternityPayRural;
    delete data.cadastralUpdate;

    return data;
  }
}
