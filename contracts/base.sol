// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

interface IERC5484 {
    /// A guideline to standardlize burn-authorization's number coding
    enum BurnAuth {
        IssuerOnly,
        OwnerOnly,
        Both,
        Neither
    }

    /// @notice Emitted when a soulbound token is issued.
    /// @dev This emit is an add-on to nft's transfer emit in order to distinguish sbt
    /// from vanilla nft while providing backward compatibility.
    /// @param from The issuer
    /// @param to The receiver
    /// @param tokenId The id of the issued token
    event Issued(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId,
        BurnAuth burnAuth
    );

    /// @notice provides burn authorization of the token id.
    /// @dev unassigned tokenIds are invalid, and queries do throw
    /// @param tokenId The identifier for a token.
    function burnAuth(uint256 tokenId) external view returns (BurnAuth);
}

contract AvatarBase is Ownable, ERC721Enumerable, IERC5484 {
    using Strings for uint256;

    string _customBaseURI = "https://0.dev.astralisse.com/avatar/metadata/";
    uint256 _nextTokenId = 0;

    constructor() Ownable(msg.sender) ERC721("Avatar Base", "AB") {}

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        require(
            _ownerOf(tokenId) == address(0),
            "Soulbound token cannot be transferred"
        );
        return super._update(to, tokenId, auth);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _customBaseURI;
    }

    function setBaseURI(string memory uri) public onlyOwner {
        _customBaseURI = uri;
    }

    function burnAuth(uint256) external pure returns (BurnAuth) {
        return BurnAuth.Neither;
    }

    function mint() public {
        require(balanceOf(msg.sender) == 0, "Only 1 token per account");
        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
        emit Issued(msg.sender, msg.sender, tokenId, BurnAuth.Neither);
    }
}
