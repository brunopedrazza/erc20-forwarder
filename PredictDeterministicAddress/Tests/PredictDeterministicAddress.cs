namespace Tests;

public class PredictDeterministicAddress
{
    [Test]
    public void ShouldMatchPredictedAddress()
    {
        const string shouldPredict = "0x8c58EA42dD763cadeB56abbB3C201171b4B42f69";
        
        const string factory = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
        const string implementation = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        const string parentAddress = "0x29021D3658fb7aA11383a09117662248e9054223";
        const string salt = "84735";
            
        var predictedAddress = EthereumAddressPredictor.PredictDeterministicAddress(implementation, salt, factory, parentAddress);
        Assert.That(predictedAddress, Is.EqualTo(shouldPredict));
    }
    
    [Test]
    public void ShouldNotMatchPredictedAddressDifferentSalt()
    {
        const string shouldNotPredict = "0x8c58EA42dD763cadeB56abbB3C201171b4B42f69";
        
        const string factory = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
        const string implementation = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        const string parentAddress = "0x29021D3658fb7aA11383a09117662248e9054223";
        const string salt = "38495";
            
        var predictedAddress = EthereumAddressPredictor.PredictDeterministicAddress(implementation, salt, factory, parentAddress);
        Assert.That(predictedAddress, Is.Not.EqualTo(shouldNotPredict));
    }
    
    [Test]
    public void ShouldNotMatchPredictedAddressDifferentParentAddress()
    {
        const string shouldNotPredict = "0x8c58EA42dD763cadeB56abbB3C201171b4B42f69";
        
        const string factory = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
        const string implementation = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        const string parentAddress = "0xAB4d4C3Eb1A010345598cC379B04d30f8db67da8";
        const string salt = "84735";
            
        var predictedAddress = EthereumAddressPredictor.PredictDeterministicAddress(implementation, salt, factory, parentAddress);
        Assert.That(predictedAddress, Is.Not.EqualTo(shouldNotPredict));
    }
}