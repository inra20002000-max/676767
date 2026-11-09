export interface DemographicGroup {
  id: string;
  country: string;
  ru: string;
  en: string;
  ko: string;
}

export const VULNERABLE_GROUPS: DemographicGroup[] = [
  {
    "id": "au_ind",
    "country": "AUS",
    "ru": "коренные австралийцы или жители островов Торресова пролива",
    "en": "Aboriginal or Torres Strait Islander",
    "ko": "호주 원주민"
  },
  {
    "id": "bo_ind",
    "country": "BOL",
    "ru": "коренные жители",
    "en": "Indigenous",
    "ko": "원주민"
  },
  {
    "id": "br_negro",
    "country": "BRA",
    "ru": "чернокожие или люди смешанного происхождения (прету, парду)",
    "en": "Black or mixed-race (preto, pardo)",
    "ko": "흑인·혼혈(프레투·파르두)"
  },
  {
    "id": "ca_ind",
    "country": "CAN",
    "ru": "коренные жители Канады (первые нации, метисы или инуиты)",
    "en": "Indigenous (First Nations, Métis or Inuit)",
    "ko": "캐나다 원주민"
  },
  {
    "id": "ca_inu",
    "country": "CAN",
    "ru": "инуиты",
    "en": "Inuit",
    "ko": "이누이트"
  },
  {
    "id": "cl_mapu",
    "country": "CHL",
    "ru": "мапуче",
    "en": "Mapuche",
    "ko": "마푸체"
  },
  {
    "id": "cn_uyg",
    "country": "CHN",
    "ru": "уйгуры",
    "en": "Uyghur",
    "ko": "위구르족"
  },
  {
    "id": "cn_hui",
    "country": "CHN",
    "ru": "хуэй",
    "en": "Hui",
    "ko": "후이족"
  },
  {
    "id": "cn_tib",
    "country": "CHN",
    "ru": "тибетцы",
    "en": "Tibetan",
    "ko": "티베트족"
  },
  {
    "id": "cn_min",
    "country": "CHN",
    "ru": "этническое меньшинство",
    "en": "Ethnic minority",
    "ko": "소수민족"
  },
  {
    "id": "co_afro",
    "country": "COL",
    "ru": "афроколумбийцы",
    "en": "Afro-Colombian",
    "ko": "아프리카계 콜롬비아인"
  },
  {
    "id": "co_ind",
    "country": "COL",
    "ru": "коренные жители",
    "en": "Indigenous",
    "ko": "원주민"
  },
  {
    "id": "de_turk",
    "country": "DEU",
    "ru": "немцы турецкого происхождения",
    "en": "Turkish German",
    "ko": "튀르키예계 독일인"
  },
  {
    "id": "ec_ind",
    "country": "ECU",
    "ru": "коренные жители",
    "en": "Indigenous",
    "ko": "원주민"
  },
  {
    "id": "ec_afro",
    "country": "ECU",
    "ru": "афроэквадорцы",
    "en": "Afro-Ecuadorian",
    "ko": "아프리카계 에콰도르인"
  },
  {
    "id": "fi_sami",
    "country": "FIN",
    "ru": "саамы",
    "en": "Sámi",
    "ko": "사미"
  },
  {
    "id": "fr_magh",
    "country": "FRA",
    "ru": "французы североафриканского происхождения",
    "en": "French of North African descent",
    "ko": "북아프리카계 프랑스인"
  },
  {
    "id": "gb_pak",
    "country": "GBR",
    "ru": "британцы пакистанского или бангладешского происхождения",
    "en": "British Pakistani or Bangladeshi",
    "ko": "파키스탄·방글라데시계 영국인"
  },
  {
    "id": "gb_ind",
    "country": "GBR",
    "ru": "британцы индийского происхождения",
    "en": "British Indian",
    "ko": "인도계 영국인"
  },
  {
    "id": "gb_black",
    "country": "GBR",
    "ru": "чернокожие британцы (африканского или карибского происхождения)",
    "en": "Black British (African or Caribbean)",
    "ko": "아프리카·카리브계 영국인"
  },
  {
    "id": "gt_maya",
    "country": "GTM",
    "ru": "коренные майя",
    "en": "Indigenous Maya",
    "ko": "마야 원주민"
  },
  {
    "id": "in_adiv",
    "country": "IND",
    "ru": "адиваси (зарегистрированные племена)",
    "en": "Adivasi (Scheduled Tribe)",
    "ko": "아디바시(지정 부족)"
  },
  {
    "id": "il_arab",
    "country": "ISR",
    "ru": "арабские граждане Израиля",
    "en": "Arab citizen of Israel",
    "ko": "아랍계 이스라엘 시민"
  },
  {
    "id": "jp_mix",
    "country": "JPN",
    "ru": "один из родителей родился за рубежом",
    "en": "One parent born abroad",
    "ko": "부모 한쪽이 외국 출신"
  },
  {
    "id": "jp_zai",
    "country": "JPN",
    "ru": "корейцы зайничи",
    "en": "Zainichi Korean",
    "ko": "재일 한국인(자이니치)"
  },
  {
    "id": "ke_maa",
    "country": "KEN",
    "ru": "масаи",
    "en": "Maasai",
    "ko": "마사이"
  },
  {
    "id": "kr_mix",
    "country": "KOR",
    "ru": "мультикультурная семья",
    "en": "A multicultural family",
    "ko": "다문화 가정"
  },
  {
    "id": "lk_tamil",
    "country": "LKA",
    "ru": "тамилы",
    "en": "Tamil",
    "ko": "타밀족"
  },
  {
    "id": "mx_ind",
    "country": "MEX",
    "ru": "коренные жители",
    "en": "Indigenous",
    "ko": "원주민"
  },
  {
    "id": "my_chin",
    "country": "MYS",
    "ru": "малайзийские китайцы",
    "en": "Chinese Malaysian",
    "ko": "중국계 말레이시아인"
  },
  {
    "id": "my_ind",
    "country": "MYS",
    "ru": "малайзийские индийцы",
    "en": "Indian Malaysian",
    "ko": "인도계 말레이시아인"
  },
  {
    "id": "no_sami",
    "country": "NOR",
    "ru": "саамы",
    "en": "Sámi",
    "ko": "사미"
  },
  {
    "id": "nz_maori",
    "country": "NZL",
    "ru": "маори",
    "en": "Māori",
    "ko": "마오리"
  },
  {
    "id": "nz_pasi",
    "country": "NZL",
    "ru": "выходцы с островов Тихого океана (пасифика)",
    "en": "Pacific Islander (Pasifika)",
    "ko": "태평양 섬 출신(파시피카)"
  },
  {
    "id": "pe_ind",
    "country": "PER",
    "ru": "коренные жители",
    "en": "Indigenous",
    "ko": "원주민"
  },
  {
    "id": "ru_cauc",
    "country": "RUS",
    "ru": "народы Северного Кавказа",
    "en": "North Caucasian peoples",
    "ko": "북캅카스 민족"
  },
  {
    "id": "ru_turk",
    "country": "RUS",
    "ru": "тюркские народы",
    "en": "Turkic peoples",
    "ko": "튀르크계 민족"
  },
  {
    "id": "ru_bud",
    "country": "RUS",
    "ru": "этническое меньшинство",
    "en": "Ethnic minority",
    "ko": "소수민족"
  },
  {
    "id": "ru_sakha",
    "country": "RUS",
    "ru": "якуты (саха)",
    "en": "Sakha (Yakut)",
    "ko": "사하족"
  },
  {
    "id": "se_sami",
    "country": "SWE",
    "ru": "саамы",
    "en": "Sámi",
    "ko": "사미"
  },
  {
    "id": "th_malay",
    "country": "THA",
    "ru": "тайцы малайского происхождения",
    "en": "Malay Thai",
    "ko": "말레이계 태국인"
  },
  {
    "id": "th_hill",
    "country": "THA",
    "ru": "горные народы",
    "en": "Hill peoples",
    "ko": "산지 민족"
  },
  {
    "id": "tr_kurd",
    "country": "TUR",
    "ru": "курды",
    "en": "Kurdish",
    "ko": "쿠르드인"
  },
  {
    "id": "tw_mix",
    "country": "TWN",
    "ru": "мультикультурная семья",
    "en": "A multicultural family",
    "ko": "다문화 가정"
  },
  {
    "id": "us_hisp",
    "country": "USA",
    "ru": "латиноамериканцы",
    "en": "Hispanic or Latino",
    "ko": "히스패닉·라티노"
  },
  {
    "id": "us_asian",
    "country": "USA",
    "ru": "американцы азиатского происхождения",
    "en": "Asian American",
    "ko": "아시아계 미국인"
  },
  {
    "id": "us_black",
    "country": "USA",
    "ru": "афроамериканцы",
    "en": "African American",
    "ko": "아프리카계 미국인"
  },
  {
    "id": "us_native",
    "country": "USA",
    "ru": "коренные американцы",
    "en": "Native American",
    "ko": "아메리카 원주민"
  },
  {
    "id": "vn_min",
    "country": "VNM",
    "ru": "этническое меньшинство",
    "en": "Ethnic minority",
    "ko": "소수민족"
  },
  {
    "id": "za_ind",
    "country": "ZAF",
    "ru": "южноафриканцы индийского происхождения",
    "en": "Indian South African",
    "ko": "인도계"
  },
  {
    "id": "za_white",
    "country": "ZAF",
    "ru": "белые",
    "en": "White",
    "ko": "백인"
  },
  {
    "id": "za_col",
    "country": "ZAF",
    "ru": "цветные (люди смешанного происхождения)",
    "en": "Coloured (mixed heritage)",
    "ko": "컬러드(혼혈)"
  },
  {
    "id": "za_black",
    "country": "ZAF",
    "ru": "чернокожие африканцы",
    "en": "Black African",
    "ko": "흑인(아프리카인)"
  }
];

export const CASTES: DemographicGroup[] = [
  {
    "id": "dalit_not_scheduled",
    "country": "IND",
    "ru": "Далиты (не признаются зарегистрированной кастой)",
    "en": "Dalit (not recognised as a Scheduled Caste)",
    "ko": "달리트(지정 카스트로 인정되지 않음)"
  },
  {
    "id": "general",
    "country": "IND",
    "ru": "Общая категория",
    "en": "General category",
    "ko": "일반 범주"
  },
  {
    "id": "obc",
    "country": "IND",
    "ru": "Другие отсталые классы (OBC)",
    "en": "Other Backward Class (OBC)",
    "ko": "기타 후진 계층(OBC)"
  },
  {
    "id": "scheduled_caste",
    "country": "IND",
    "ru": "Зарегистрированная каста (далиты)",
    "en": "Scheduled Caste (Dalit)",
    "ko": "지정 카스트(달리트)"
  },
  {
    "id": "dalit",
    "country": "NPL",
    "ru": "Далиты",
    "en": "Dalit",
    "ko": "달리트"
  },
  {
    "id": "janajati",
    "country": "NPL",
    "ru": "Джанаджати (коренная национальность)",
    "en": "Janajati (Indigenous nationality)",
    "ko": "자나자티(원주민 민족)"
  },
  {
    "id": "khas_arya",
    "country": "NPL",
    "ru": "кхас-арья",
    "en": "Khas Arya",
    "ko": "카스 아리아"
  },
  {
    "id": "madhesi",
    "country": "NPL",
    "ru": "мадхеси",
    "en": "Madhesi",
    "ko": "마데시"
  }
];

export const GROUPS_BY_COUNTRY: Record<string, DemographicGroup[]> = {};
for (const g of VULNERABLE_GROUPS) {
  if (!GROUPS_BY_COUNTRY[g.country]) GROUPS_BY_COUNTRY[g.country] = [];
  GROUPS_BY_COUNTRY[g.country].push(g);
}

export const CASTES_BY_COUNTRY: Record<string, DemographicGroup[]> = {};
for (const c of CASTES) {
  if (!CASTES_BY_COUNTRY[c.country]) CASTES_BY_COUNTRY[c.country] = [];
  CASTES_BY_COUNTRY[c.country].push(c);
}
