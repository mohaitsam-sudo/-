/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BusRouteStep {
  stopId: string;
  nameArabic: string;
  nameEnglish: string;
  passengerQuota: number;
}

export interface BusMission {
  id: string;
  titleArabic: string;
  titleEnglish: string;
  descriptionArabic: string;
  descriptionEnglish: string;
  rewardEGP: number;
  steps: BusRouteStep[];
}

export const MISSIONS_LIST: BusMission[] = [
  {
    id: 'route-101',
    titleArabic: 'خط 101: مسار وسط البلد - كورنيش النيل',
    titleEnglish: 'Line 101: Downtown to Nile Corniche',
    descriptionArabic: 'انطلق من ميدان التحرير المركزي، وتوجه لنقل الركاب وصولاً إلى ممشى كورنيش النيل الجميل.',
    descriptionEnglish: 'Pick up commuters from Central Tahrir Plaza and transport them safely to the Nile Corniche promenade.',
    rewardEGP: 450,
    steps: [
      {
        stopId: 'stop-1',
        nameArabic: 'محطة ميدان التحرير المركزية',
        nameEnglish: 'Tahrir Central Station',
        passengerQuota: 3,
      },
      {
        stopId: 'stop-2',
        nameArabic: 'محطة كورنيش النيل والنافورة',
        nameEnglish: 'Nile Corniche Promenade',
        passengerQuota: 3,
      },
    ],
  },
  {
    id: 'route-202',
    titleArabic: 'خط 202: مسار المستشفى العام - سيتي سنتر مول',
    titleEnglish: 'Line 202: General Hospital to Capital Mall',
    descriptionArabic: 'خط ركاب حيوي يربط بين منطقة مستشفى الطوارئ العام وأكبر مركز تسوق تجاري في العاصمة.',
    descriptionEnglish: 'Crucial commuter link connecting General Hospital Emergency to Capital City Mall & Cinema.',
    rewardEGP: 600,
    steps: [
      {
        stopId: 'stop-3',
        nameArabic: 'محطة مستشفى الطوارئ العام',
        nameEnglish: 'General Hospital Emergency',
        passengerQuota: 3,
      },
      {
        stopId: 'stop-4',
        nameArabic: 'محطة سيتي سنتر مول والسينما',
        nameEnglish: 'Capital City Mall',
        passengerQuota: 3,
      },
      {
        stopId: 'stop-1',
        nameArabic: 'محطة ميدان التحرير المركزية',
        nameEnglish: 'Tahrir Central Station',
        passengerQuota: 3,
      },
    ],
  },
  {
    id: 'route-303',
    titleArabic: 'المسار السريع: إكسبريس كوبري النيل المعلق',
    titleEnglish: 'Highway Express: Grand Nile Bridge Route',
    descriptionArabic: 'رحلة سياحية سريعة تعبر الطريق السريع وأعلى كوبري النيل المعلق مع إطلالة خلابة على النهر.',
    descriptionEnglish: 'High-speed express coach journey across the elevated Nile suspension bridge with scenic river views.',
    rewardEGP: 850,
    steps: [
      {
        stopId: 'stop-1',
        nameArabic: 'محطة ميدان التحرير المركزية',
        nameEnglish: 'Tahrir Central Station',
        passengerQuota: 3,
      },
      {
        stopId: 'stop-2',
        nameArabic: 'محطة كورنيش النيل والنافورة',
        nameEnglish: 'Nile Corniche Promenade',
        passengerQuota: 3,
      },
      {
        stopId: 'stop-4',
        nameArabic: 'محطة سيتي سنتر مول والسينما',
        nameEnglish: 'Capital City Mall',
        passengerQuota: 3,
      },
    ],
  },
  {
    id: 'free-roam',
    titleArabic: 'القيادة الحرة: جولة مفتوحة في المحروسة',
    titleEnglish: 'Free Roam: Open City Exploration',
    descriptionArabic: 'تجول بحرية في شوارع وميادين المدينة المصرية، وتوقف عند أي محطة لنقل الركاب والتزود بالوقود.',
    descriptionEnglish: 'Explore the Egyptian streets freely, pick up passengers at any station, refuel at gas stations without time limits.',
    rewardEGP: 200,
    steps: [],
  },
];
