import { FileUploader } from '../utils/fileUploader';

export const uploadAvatar = FileUploader.createAvatarUpload().single('avatar');
export const uploadItemImages = FileUploader.createItemImageUpload().array('images', 5);
