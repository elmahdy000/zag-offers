import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateOfferDto } from './create-offer.dto';

class MerchantOfferFields extends OmitType(CreateOfferDto, [
  'storeId',
  'isFeatured',
] as const) {}

export class UpdateMerchantOfferDto extends PartialType(MerchantOfferFields) {}
