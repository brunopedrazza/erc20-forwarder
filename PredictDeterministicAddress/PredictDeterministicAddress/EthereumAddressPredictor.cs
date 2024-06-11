using System.Numerics;
using Nethereum.ABI;
using Nethereum.Util;

public class EthereumAddressPredictor
{
    private const string ProxyStart = "0x3d602d80600a3d3981f3363d3d373d3d3d363d73";
    private const string ProxyEnd = "5af43d82803e903d91602b57fd5bf3";

    public static string PredictDeterministicAddress(string implementationAddress, string salt, string factoryAddress, string parentAddress)
    {
        var finalSalt = GetFinalSalt(salt, parentAddress);
        
        var creationCode = ProxyStart + RemoveHexPrefix(implementationAddress).ToLower() + ProxyEnd;
        var bytecode = Keccak256(creationCode);

        var combined = $"0xff{RemoveHexPrefix(factoryAddress)}{RemoveHexPrefix(finalSalt)}{RemoveHexPrefix(bytecode)}";
        var finalHash = Keccak256(combined);

        var address = finalHash[^40..];
        return ToChecksumAddress($"0x{address}");
    }
    
    private static string IntegerToHex32Bytes(string value)
    {
        var numericValue = BigInteger.Parse(value);
        var hex = numericValue.ToString("x");
        var paddedHex = hex.PadLeft(64, '0');
        var finalHex = "0x" + paddedHex;
        return finalHex;
    }

    private static string Keccak256(string value) => 
        new Sha3Keccack().CalculateHashFromHex(RemoveHexPrefix(value));

    private static string RemoveHexPrefix(string value) => 
        value.StartsWith("0x") ? value[2..] : value;

    private static string ToChecksumAddress(string address) => 
        new AddressUtil().ConvertToChecksumAddress(address);
    
    private static string GetFinalSalt(string salt, string parentAddress)
    {
        var hexSalt = RemoveHexPrefix(IntegerToHex32Bytes(salt));
        var saltBytes = Convert.FromHexString(hexSalt);
        
        var encodedPackedBytes = new ABIEncode().GetABIEncodedPacked(
            new ABIValue(ABIType.CreateABIType("address"), parentAddress), 
            new ABIValue(ABIType.CreateABIType("bytes32"), saltBytes));
        
        var encodedPackedHex = Convert.ToHexString(encodedPackedBytes);
        return Keccak256(encodedPackedHex);
    }
}