type UserAvatarProps = {
  img: string;
  login: string;
};

export const UserAvatar = ({ img, login }: UserAvatarProps) => (
  <div class="tooltip" data-tip={login}>
    <div class="avatar">
      <div class="w-8 rounded-full">
        {img && <img src={img} alt={`${login}'s avatar`} />}
      </div>
    </div>
  </div>
);
